import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod/v4";
import { draftVolumeSectionsWithOpenAI } from "./draft-sections.js";
import { evaluateProposalWithOpenAI } from "./evaluate.js";
import { suggestVolumeSectionsWithOpenAI } from "./section-suggestions.js";
import type {
  EvaluationResult,
  Project,
  VolumeSection,
  VolumeSectionKey,
} from "../src/types";

declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  body?: unknown;
  rawHeaders?: string[];
};

type ApiResponse = {
  end: (body?: unknown) => void;
  headersSent?: boolean;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
};

const SECTION_DEFINITIONS: Array<Pick<VolumeSection, "key" | "title">> = [
  { key: "problemNeed", title: "Problem / Need" },
  { key: "technicalApproach", title: "Technical Approach" },
  { key: "innovation", title: "Innovation" },
  { key: "workPlan", title: "Work Plan" },
  { key: "team", title: "Team" },
  { key: "commercializationTransition", title: "Commercialization / Transition" },
  { key: "risks", title: "Risks" },
  { key: "budgetNarrative", title: "Budget Narrative" },
];

const SECTION_KEYS = SECTION_DEFINITIONS.map((section) => section.key) as [
  VolumeSectionKey,
  ...VolumeSectionKey[],
];

const sectionKeySchema = z.enum(SECTION_KEYS);
const currentSectionSchema = z.object({
  key: sectionKeySchema.describe("Technical volume section key."),
  title: z.string().optional().describe("Human-readable section title."),
  content: z.string().describe("Current section text to review or improve."),
});

const baseProjectShape = {
  project_name: z.string().optional().describe("Proposal or project name."),
  agency: z.string().optional().describe("Agency or customer, for example DAF/AFWERX."),
  program: z.string().optional().describe("Program name, for example SBIR or STTR."),
  phase: z.string().optional().describe("SBIR/STTR phase, for example Phase I or Phase II."),
  topic_id: z.string().optional().describe("Solicitation topic ID."),
  due_date: z.string().optional().describe("Proposal due date if known."),
  solicitation_text: z.string().min(1).describe("Solicitation, topic, or funding opportunity text."),
};

const proposalTextSchema = z
  .string()
  .min(1)
  .describe("Proposal draft, concept note, or technical volume text to evaluate.");

const sectionInputsShape = {
  current_sections: z
    .array(currentSectionSchema)
    .optional()
    .describe("Current technical volume sections. Use when section-level drafting or recommendations are needed."),
  target_sections: z
    .array(sectionKeySchema)
    .optional()
    .describe("Specific technical volume section keys to improve or review. Omit to use all sections."),
};

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const noAuthMeta = {
  securitySchemes: [{ type: "noauth" }],
};

const textResult = (text: string, structuredContent: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text }],
  structuredContent,
});

const list = (items: string[] | undefined, fallback: string) => {
  const values = items?.filter(Boolean).slice(0, 5);
  return values?.length ? values.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;
};

const summarizeEvaluation = (evaluation: EvaluationResult) =>
  [
    `Readiness score: ${evaluation.readinessScore}/100.`,
    "Priority rewrite actions:",
    list(evaluation.rewriteActions, "Review the structured evaluation for priority actions."),
  ].join("\n");

const normalizeString = (value: string | undefined, fallback: string) => {
  const cleaned = value?.trim();
  return cleaned || fallback;
};

const sectionsFromInput = (
  currentSections: Array<z.infer<typeof currentSectionSchema>> | undefined,
): VolumeSection[] => {
  const sectionByKey = new Map<VolumeSectionKey, VolumeSection>();

  for (const section of currentSections ?? []) {
    sectionByKey.set(section.key, {
      key: section.key,
      title:
        normalizeString(
          section.title,
          SECTION_DEFINITIONS.find((definition) => definition.key === section.key)?.title ?? section.key,
        ),
      content: section.content,
    });
  }

  return SECTION_DEFINITIONS.map((definition) => ({
    key: definition.key,
    title: sectionByKey.get(definition.key)?.title ?? definition.title,
    content: sectionByKey.get(definition.key)?.content ?? "",
  }));
};

const getSectionKeys = (targetSections: VolumeSectionKey[] | undefined) => {
  if (!targetSections?.length) return undefined;
  return [...new Set(targetSections)];
};

const makeProject = ({
  project_name,
  agency,
  program,
  phase,
  topic_id,
  due_date,
  solicitation_text,
  proposal_text,
  current_sections,
  evaluation,
}: {
  project_name?: string;
  agency?: string;
  program?: string;
  phase?: string;
  topic_id?: string;
  due_date?: string;
  solicitation_text: string;
  proposal_text: string;
  current_sections?: Array<z.infer<typeof currentSectionSchema>>;
  evaluation?: EvaluationResult | null;
}): Project => {
  const now = new Date().toISOString();

  return {
    id: `mcp-${Date.now()}`,
    name: normalizeString(project_name, "SBIR/STTR MCP Project"),
    agency: normalizeString(agency, "DAF/AFWERX"),
    program: normalizeString(program, "SBIR/STTR"),
    topicId: normalizeString(topic_id, "Unspecified topic"),
    phase: normalizeString(phase, "Phase I"),
    dueDate: normalizeString(due_date, ""),
    createdAt: now,
    updatedAt: now,
    solicitationText: solicitation_text,
    proposalText: proposal_text,
    evaluation: evaluation ?? null,
    sections: sectionsFromInput(current_sections),
  };
};

const createServer = () => {
  const server = new McpServer({
    name: "tradky-sbir-sttr-evaluator",
    version: "1.0.0",
  });

  server.registerTool(
    "evaluate_proposal",
    {
      title: "Evaluate Proposal",
      description:
        "Evaluate an SBIR/STTR proposal against the DAF/AFWERX rubric and return readiness, rubric scores, gaps, cost-volume checks, and rewrite actions.",
      inputSchema: {
        ...baseProjectShape,
        proposal_text: proposalTextSchema,
      },
      annotations: readOnlyAnnotations,
      _meta: noAuthMeta,
    },
    async (args) => {
      const project = makeProject({
        ...args,
        proposal_text: args.proposal_text,
      });
      const evaluation = await evaluateProposalWithOpenAI({
        project,
        solicitationText: args.solicitation_text,
        proposalText: args.proposal_text,
      });

      return textResult(summarizeEvaluation(evaluation), { evaluation });
    },
  );

  server.registerTool(
    "analyze_topic",
    {
      title: "Analyze Topic",
      description:
        "Analyze an SBIR/STTR topic or solicitation and identify evidence needed for a stronger DAF/AFWERX proposal.",
      inputSchema: {
        ...baseProjectShape,
        concept_text: z
          .string()
          .optional()
          .describe("Optional concept notes or early proposal text to compare against the topic."),
      },
      annotations: readOnlyAnnotations,
      _meta: noAuthMeta,
    },
    async (args) => {
      const proposalText = normalizeString(
        args.concept_text,
        "No proposal draft was supplied. Analyze the topic requirements and identify the evidence a proposal must provide.",
      );
      const project = makeProject({
        ...args,
        proposal_text: proposalText,
      });
      const evaluation = await evaluateProposalWithOpenAI({
        project,
        solicitationText: args.solicitation_text,
        proposalText,
      });
      const topicAnalysis = {
        topicId: project.topicId,
        phase: project.phase,
        readinessScore: evaluation.readinessScore,
        evidenceToGather: evaluation.complianceGaps,
        technicalFocus: evaluation.technicalMerit,
        commercializationFocus: evaluation.commercialization,
        transitionFocus: evaluation.transitionPotential,
        recommendedNextSteps: evaluation.rewriteActions,
      };

      return textResult(
        [
          `Topic analysis for ${project.topicId}.`,
          "Recommended next steps:",
          list(topicAnalysis.recommendedNextSteps, "Draft a proposal section-by-section against the topic criteria."),
        ].join("\n"),
        { topicAnalysis, evaluation },
      );
    },
  );

  server.registerTool(
    "improve_technical_volume",
    {
      title: "Improve Technical Volume",
      description:
        "Draft or improve selected SBIR/STTR technical volume sections using the solicitation, proposal draft, and current section text.",
      inputSchema: {
        ...baseProjectShape,
        proposal_text: proposalTextSchema,
        ...sectionInputsShape,
      },
      annotations: readOnlyAnnotations,
      _meta: noAuthMeta,
    },
    async (args) => {
      const project = makeProject({
        ...args,
        proposal_text: args.proposal_text,
        current_sections: args.current_sections,
      });
      const draft = await draftVolumeSectionsWithOpenAI({
        project,
        sectionKeys: getSectionKeys(args.target_sections),
      });

      return textResult(
        `Drafted ${draft.sections.length} technical volume section${draft.sections.length === 1 ? "" : "s"}.`,
        { draft },
      );
    },
  );

  server.registerTool(
    "generate_recommendations",
    {
      title: "Generate Recommendations",
      description:
        "Generate evaluator-style SBIR/STTR proposal recommendations, with optional section-level suggestions when current sections are provided.",
      inputSchema: {
        ...baseProjectShape,
        proposal_text: proposalTextSchema,
        ...sectionInputsShape,
        include_section_suggestions: z
          .boolean()
          .optional()
          .describe("Set true to also run section-level reviewer suggestions for the current sections."),
      },
      annotations: readOnlyAnnotations,
      _meta: noAuthMeta,
    },
    async (args) => {
      const evaluationProject = makeProject({
        ...args,
        proposal_text: args.proposal_text,
        current_sections: args.current_sections,
      });
      const evaluation = await evaluateProposalWithOpenAI({
        project: evaluationProject,
        solicitationText: args.solicitation_text,
        proposalText: args.proposal_text,
      });

      let sectionRecommendations: Awaited<ReturnType<typeof suggestVolumeSectionsWithOpenAI>> | null = null;
      if (args.include_section_suggestions) {
        const suggestionsProject = makeProject({
          ...args,
          proposal_text: args.proposal_text,
          current_sections: args.current_sections,
          evaluation,
        });
        sectionRecommendations = await suggestVolumeSectionsWithOpenAI({
          project: suggestionsProject,
          sectionKeys: getSectionKeys(args.target_sections),
        });
      }

      return textResult(summarizeEvaluation(evaluation), {
        recommendations: {
          readinessScore: evaluation.readinessScore,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          complianceGaps: evaluation.complianceGaps,
          technicalMerit: evaluation.technicalMerit,
          commercialization: evaluation.commercialization,
          transitionPotential: evaluation.transitionPotential,
          rewriteActions: evaluation.rewriteActions,
          sectionRecommendations,
        },
      });
    },
  );

  return server;
};

const parseBody = (body: unknown) => {
  if (typeof body !== "string") return body;
  return body.trim() ? JSON.parse(body) : undefined;
};

const setCorsHeaders = (res: ApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
  );
  res.setHeader("Access-Control-Expose-Headers", "MCP-Protocol-Version, MCP-Session-Id");
};

const writeJsonRpcError = (res: ApiResponse, statusCode: number, message: string) => {
  if (res.headersSent) return;
  res.status(statusCode).json({
    jsonrpc: "2.0",
    error: {
      code: -32603,
      message,
    },
    id: null,
  });
};

const ensureMcpAcceptHeader = (req: ApiRequest) => {
  if (!req.headers) return;

  const current = req.headers.accept;
  const accept = Array.isArray(current) ? current.join(", ") : current;
  if (accept?.includes("application/json") && accept.includes("text/event-stream")) return;

  const nextAccept = accept ? `${accept}, application/json, text/event-stream` : "application/json, text/event-stream";
  req.headers.accept = nextAccept;

  if (!req.rawHeaders) return;

  const acceptIndex = req.rawHeaders.findIndex((value, index) => index % 2 === 0 && value.toLowerCase() === "accept");
  if (acceptIndex >= 0) {
    req.rawHeaders[acceptIndex + 1] = nextAccept;
  } else {
    req.rawHeaders.push("accept", nextAccept);
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    writeJsonRpcError(res, 405, "Method not allowed. MCP clients should POST JSON-RPC requests to this endpoint.");
    return;
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    ensureMcpAcceptHeader(req);
    await server.connect(transport);
    await transport.handleRequest(req as never, res as never, parseBody(req.body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal MCP server error.";
    writeJsonRpcError(res, 500, message);
  } finally {
    await transport.close();
    await server.close();
  }
}
