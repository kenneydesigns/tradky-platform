import OpenAI from "openai";
import { VOLUME_SECTION_KEYS } from "../src/data/volumeSections";
import { getSolicitationProfile } from "../src/data/solicitationProfiles";
import { getSectionPurpose } from "../src/data/sectionPurposes";
import type {
  ComplianceFinding,
  ImplementSectionSuggestionsInput,
  ImplementSectionSuggestionsResult,
  Project,
  VolumeSection,
  VolumeSectionKey,
} from "../src/types";

declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  end: () => void;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
};

type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

const DEFAULT_MODEL = "gpt-5.4-mini";
const MAX_SOLICITATION_CHARS = 55_000;
const MAX_PROPOSAL_CHARS = 85_000;
const MAX_SECTION_CHARS = 18_000;
const MAX_SUGGESTION_CHARS = 1_000;
const REASONING_EFFORTS = new Set<ReasoningEffort>(["none", "minimal", "low", "medium", "high", "xhigh"]);
const SECTION_KEYS: VolumeSectionKey[] = [...VOLUME_SECTION_KEYS];
const SECTION_KEY_SET = new Set<string>(SECTION_KEYS);

const sectionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["key", "title", "content"],
  properties: {
    key: { type: "string", enum: SECTION_KEYS },
    title: { type: "string" },
    content: { type: "string" },
  },
};

const implementedSectionSchema = {
  type: "json_schema",
  name: "implemented_section_rewrite",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["section"],
    properties: {
      section: sectionSchema,
    },
  },
} as const;

const parseRequestBody = (body: unknown): unknown => {
  if (typeof body !== "string") return body;
  return JSON.parse(body);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isVolumeSection = (value: unknown): value is VolumeSection => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    SECTION_KEY_SET.has(value.key) &&
    typeof value.title === "string" &&
    typeof value.content === "string"
  );
};

const isProject = (value: unknown): value is Project => {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.agency === "string" &&
    typeof value.program === "string" &&
    typeof value.topicId === "string" &&
    typeof value.phase === "string" &&
    typeof value.dueDate === "string" &&
    typeof value.solicitationText === "string" &&
    typeof value.proposalText === "string" &&
    Array.isArray(value.sections) &&
    value.sections.every(isVolumeSection)
  );
};

const isImplementSectionSuggestionsInput = (value: unknown): value is ImplementSectionSuggestionsInput => {
  if (!isRecord(value) || !isProject(value.project)) return false;
  return (
    typeof value.sectionKey === "string" &&
    SECTION_KEY_SET.has(value.sectionKey) &&
    Array.isArray(value.selectedSuggestions) &&
    value.selectedSuggestions.every((suggestion) => typeof suggestion === "string")
  );
};

const truncate = (value: string, maxLength: number) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}\n\n[Input truncated for rewrite length.]`;
};

const getReasoningEffort = (value: string | undefined): ReasoningEffort => {
  if (value && REASONING_EFFORTS.has(value as ReasoningEffort)) {
    return value as ReasoningEffort;
  }

  return "low";
};

const cleanSelectedSuggestions = (selectedSuggestions: string[]) =>
  [...new Set(selectedSuggestions.map((suggestion) => truncate(suggestion, MAX_SUGGESTION_CHARS)).filter(Boolean))].slice(0, 8);

const getTargetSection = ({ project, sectionKey }: ImplementSectionSuggestionsInput) =>
  project.sections.find((section) => section.key === sectionKey);

const compactEvaluation = (project: Project) => {
  if (!project.evaluation) return null;

  return {
    readinessScore: project.evaluation.readinessScore,
    rubricScores: project.evaluation.rubricScores,
    costVolumeChecks: project.evaluation.costVolumeChecks,
    strengths: project.evaluation.strengths,
    weaknesses: project.evaluation.weaknesses,
    complianceGaps: project.evaluation.complianceGaps,
    technicalMerit: project.evaluation.technicalMerit,
    commercialization: project.evaluation.commercialization,
    transitionPotential: project.evaluation.transitionPotential,
    rewriteActions: project.evaluation.rewriteActions,
  };
};

const compactComplianceFindings = (findings: ComplianceFinding[]) =>
  findings.map((finding) => ({
    title: finding.title,
    status: finding.status,
    detail: finding.detail,
    recommendation: finding.recommendation,
    relatedSections: finding.relatedSections,
  }));

const buildRewriteInput = (input: ImplementSectionSuggestionsInput, targetSection: VolumeSection, selectedSuggestions: string[]) => {
  const profile = getSolicitationProfile(input.project.solicitationProfile);

  return {
    project: {
      name: input.project.name,
      agency: input.project.agency,
      program: input.project.program,
      phase: input.project.phase,
      topicId: input.project.topicId,
      dueDate: input.project.dueDate,
      solicitationProfile: input.project.solicitationProfile,
      solicitationNumber: input.project.solicitationNumber,
      releaseDate: input.project.releaseDate,
      openDate: input.project.openDate,
      closeDate: input.project.closeDate,
      submissionRequirements: input.project.submissionRequirements,
      evaluationWeights: input.project.evaluationWeights,
    },
    solicitationProfile: {
      key: profile.key,
      label: profile.label,
      agency: profile.agency,
      program: profile.program,
      requiredSections: profile.requiredSections,
      optionalSections: profile.optionalSections,
      evaluationEmphasis: profile.evaluationEmphasis,
      complianceChecks: profile.complianceChecks,
      requiredComplianceChecks: profile.requiredComplianceChecks,
      suggestedTone: profile.suggestedTone,
      transitionEmphasis: profile.transitionEmphasis,
      submissionRequirements: profile.submissionRequirements,
    },
    sectionPurpose: getSectionPurpose(targetSection.key),
    selectedEvaluatorSuggestions: selectedSuggestions,
    targetSection: {
      key: targetSection.key,
      title: targetSection.title,
      originalSectionText: truncate(targetSection.content, MAX_SECTION_CHARS),
    },
    proposalContext: {
      customSolicitationInstructions: truncate(input.project.customSolicitationInstructions ?? "", MAX_SOLICITATION_CHARS),
      solicitationText: truncate(input.project.solicitationText, MAX_SOLICITATION_CHARS),
      proposalText: truncate(input.project.proposalText, MAX_PROPOSAL_CHARS),
      evaluation: compactEvaluation(input.project),
      complianceFindings: compactComplianceFindings(input.project.complianceFindings),
      otherSections: input.project.sections
        .filter((section) => section.key !== targetSection.key)
        .map((section) => ({
          key: section.key,
          title: section.title,
          currentContent: truncate(section.content, MAX_SECTION_CHARS),
        })),
    },
  };
};

const normalizeRewrite = (
  value: unknown,
  input: ImplementSectionSuggestionsInput,
  targetSection: VolumeSection,
  selectedSuggestions: string[],
): ImplementSectionSuggestionsResult => {
  if (!isRecord(value) || !isVolumeSection(value.section)) {
    throw new Error("OpenAI returned an unexpected section rewrite format.");
  }

  if (value.section.key !== input.sectionKey) {
    throw new Error("OpenAI returned a rewrite for the wrong section.");
  }

  const content = value.section.content.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty section rewrite.");
  }

  return {
    generatedAt: new Date().toISOString(),
    selectedSuggestions,
    section: {
      key: input.sectionKey,
      title: targetSection.title,
      content,
    },
  };
};

export const implementSectionSuggestionsWithOpenAI = async (
  input: ImplementSectionSuggestionsInput,
): Promise<ImplementSectionSuggestionsResult> => {
  const targetSection = getTargetSection(input);
  if (!targetSection) {
    throw new Error("Request must include one valid target section.");
  }

  const selectedSuggestions = cleanSelectedSuggestions(input.selectedSuggestions);
  if (!selectedSuggestions.length) {
    throw new Error("Select at least one evaluator suggestion to implement.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured on the server.");
    error.name = "OPENAI_API_KEY_MISSING";
    throw error;
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const reasoningEffort = getReasoningEffort(process.env.OPENAI_REASONING_EFFORT);

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "developer",
        content:
          [
            "You are an expert multi-agency SBIR/STTR and BAA proposal writer working inside a technical volume builder.",
            "Rewrite exactly one target section. Return only the rewritten target section as polished proposal prose, not reviewer comments, not an implementation memo, and not markdown diff syntax.",
            "Use the original section text as the base. Apply only the selectedEvaluatorSuggestions provided by the user. Do not apply evaluator suggestions that are absent from selectedEvaluatorSuggestions, even if they would normally improve the section.",
            "Use the solicitation profile, section purpose, original section text, solicitation text, proposal text, evaluation context, compliance findings, and other existing sections to keep the rewrite aligned with the proposal's existing context.",
            "Do not rewrite, summarize, or modify unrelated sections. Other sections are context only.",
            "Do not invent named customers, partners, citations, performance data, funding commitments, signatures, regulatory approvals, technical results, or metrics. Use bracketed placeholders only when a selected suggestion requires a fact the source material does not contain.",
            "Do not generate generic filler. Every added or changed sentence should implement at least one selected suggestion using source-backed facts or precise placeholders.",
            "Keep reviewer comments and the implemented rewrite separate: do not quote the reviewer suggestions, do not say 'the reviewer noted', and do not explain what you changed inside the section text.",
            "Preserve accurate original claims and useful wording when possible, but improve structure, evidence, criteria mapping, and reviewer-facing clarity for the current section only.",
          ].join("\n\n"),
      },
      {
        role: "user",
        content: JSON.stringify(buildRewriteInput(input, targetSection, selectedSuggestions)),
      },
    ],
    max_output_tokens: 3600,
    reasoning: model.startsWith("gpt-5") ? { effort: reasoningEffort } : undefined,
    text: {
      format: implementedSectionSchema,
      verbosity: "medium",
    },
  });

  const output = response.output_text;
  if (!output) {
    throw new Error("OpenAI returned an empty section rewrite.");
  }

  return normalizeRewrite(JSON.parse(output), input, targetSection, selectedSuggestions);
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  let input: unknown;
  try {
    input = parseRequestBody(req.body);
  } catch {
    res.status(400).json({ error: "Invalid JSON request body." });
    return;
  }

  if (!isImplementSectionSuggestionsInput(input)) {
    res.status(400).json({ error: "Request must include a project, one valid target section, and selected suggestions." });
    return;
  }

  try {
    res.status(200).json(await implementSectionSuggestionsWithOpenAI(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI section rewrite failed.";
    if (error instanceof Error && error.name === "OPENAI_API_KEY_MISSING") {
      res.status(500).json({ code: error.name, error: message });
      return;
    }

    if (
      message === "Request must include one valid target section." ||
      message === "Select at least one evaluator suggestion to implement."
    ) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(502).json({ error: message });
  }
}
