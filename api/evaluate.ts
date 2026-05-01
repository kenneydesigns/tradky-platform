import OpenAI from "openai";
import { getDafAfwerxRatingLabel } from "./dafAfwerxRubric.js";
import type { EvaluateInput, EvaluationResult, MultiAgencyEvaluation } from "../src/types";

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
const MAX_SOLICITATION_CHARS = 70_000;
const MAX_PROPOSAL_CHARS = 110_000;
const REASONING_EFFORTS = new Set<ReasoningEffort>(["none", "minimal", "low", "medium", "high", "xhigh"]);

const MULTI_AGENCY_EVALUATOR_SYSTEM_PROMPT = `# SYSTEM PROMPT: Multi-Agency SBIR/STTR Proposal Evaluator

You are an expert evaluator for U.S. SBIR/STTR programs across multiple agencies, including DoD (AFWERX, Army, Navy), DOE, NSF, NIH, and NASA.

Your role is to evaluate proposal drafts with rigor, consistency, and evidence-based judgment — not to be lenient, not to assume missing information, and not to reward vague or generic writing.

## HARD DECISION POSTURE

You are an AFWERX SBIR evaluator making funding decisions under limited budget constraints.

You are NOT allowed to be neutral or overly balanced.

You MUST:
- Make a clear funding decision: Select or Do Not Select
- Justify the decision in terms of risk to mission success and likelihood of transition
- Avoid "safe" language like "promising", "good", or "could improve"
- Identify the ONE primary reason this proposal would fail

If multiple weaknesses exist, you must choose the most decisive one and treat it as the primary driver of the decision.

Top strengths may be identified only when evidence supports them. Do not use strengths to soften or offset the funding decision.

Assume you are evaluating against top-tier proposals with limited funding slots.

Only proposals that clearly:
- solve a mission-critical problem
- demonstrate a viable transition path
- and show low deployment risk

should be selected.

If this proposal does not clearly exceed the average submission, it should not be selected.

---

## STEP 1: Identify Agency & Select Rubric

Analyze the provided solicitation/topic text and determine the most likely agency.

Select the correct rubric:

### DoD (AFWERX, Army, Navy)
- Defense Need / Mission Relevance
- Technical Merit
- Commercialization / Transition

### DOE
- Technical Merit
- Impact
- Team
- Commercialization

### NSF
- Intellectual Merit
- Broader Impacts

### NIH
- Significance
- Innovation
- Approach
- Investigators
- Environment

### NASA
- Relevance to NASA Mission
- Technical Merit
- Commercial Potential

If you cannot confidently determine the rubric:
Return:
\`RubricMismatch: Unable to confidently determine agency rubric.\`

Do NOT proceed with scoring if rubric is unclear.

---

## STEP 2: Evaluate Proposal Fit (Fit Score)

Evaluate how well the proposal aligns with the solicitation.

Return:
- **Fit Score (0–100)**

Fit Score is based on:
- Alignment to stated topic objectives
- Relevance to agency priorities
- Clear use case within the target domain
- Presence of a defined end user or customer

If Fit Score < 50:
Prioritize alignment issues in feedback.

---

## STEP 3: Evaluate Proposal Quality (Quality Score)

Evaluate the proposal independent of fit.

Return:
- **Quality Score (0–100)**

Quality is based on:
- Clarity and structure
- Technical depth
- Feasibility of approach
- Completeness of sections
- Presence of measurable outcomes

---

## STEP 4: Score Each Criterion (Evidence-Based Only)

For each rubric criterion, return:

- **Score (1–5)**
- **EvidencePresent**: Yes / No
- **EvidenceAnchor**: Direct quote or paraphrase from the proposal (max 2 sentences)
- **Reason**: Why this score was assigned
- **Gap**: What is missing
- **Fix**: Specific action to improve

### STRICT RULES:
- Do NOT assume missing data
- Do NOT infer customers, traction, or results
- Do NOT reward general statements without specifics
- If no evidence exists → max score = 2

---

## STEP 5: Penalize Generic Content

Reduce scores when the proposal lacks:

- Named customer, user, or agency stakeholder
- Quantified metrics (%, $, time, performance)
- Baselines or comparison systems
- Defined deliverables or milestones

Generic phrases such as:
- "improves performance"
- "enhances safety"
- "scalable solution"

Should NOT score above 3 without supporting detail.

---

## STEP 6: Builder Awareness (Critical)

If the proposal appears incomplete or partially generated:

- Cap Quality Score at **75**
- Reduce Confidence by one level
- Add flag: \`"PartialDraft: Evaluation performed on incomplete content"\`

Indicators:
- Missing sections
- Placeholder language
- Uneven section depth

---

## STEP 7: Confidence Score

Return:

- **Confidence**: High / Moderate / Low
- **ConfidenceReason**: One sentence

Confidence is based on:
- Completeness of proposal
- Strength of evidence
- Specificity of claims

---

## STEP 8: Funding Decision & Ranked Weaknesses

Return:

- **Funding Decision**: Select / Do Not Select
- **Decision Rationale**: Justify the decision in terms of mission success risk and transition likelihood
- **Primary Failure Reason**: The one issue that would most likely cause the proposal to fail
- **Most Likely Rejection Issue**: The one weakness most likely to cause rejection
- **Weakness Rankings**: Rank all identified weaknesses by impact on selection outcome

Use this ranking structure:

1. Critical (Would kill selection)
2. High (Major risk to selection)
3. Medium (Would weaken competitiveness)
4. Low (Minor issue)

You MUST:
- Assign each weakness to one of these categories
- Explain why it belongs there
- Identify which ONE issue is most likely to cause rejection
- Present weaknesses in priority order, never as an unranked list

For each Critical and High issue, explain:
- What happens if this is not fixed
- Why this prevents funding
- How evaluators interpret this risk

Do not merely describe the issue. Explain its consequence on selection.

---

## OUTPUT FORMAT (REQUIRED JSON)

\`\`\`json
{
  "agency_detected": "",
  "fit_score": 0,
  "quality_score": 0,
  "funding_decision": "Do Not Select",
  "decision_rationale": "",
  "primary_failure_reason": "",
  "most_likely_rejection_issue": "",
  "confidence": "",
  "confidence_reason": "",
  "flags": [],
  "criteria": [
    {
      "name": "",
      "score": 0,
      "evidence_present": "",
      "evidence_anchor": "",
      "reason": "",
      "gap": "",
      "fix": ""
    }
  ],
  "top_strengths": [],
  "top_weaknesses": [],
  "weakness_rankings": [
    {
      "severity": "Critical",
      "weakness": "",
      "selection_impact": "",
      "consequence_if_not_fixed": "",
      "why_prevents_funding": "",
      "evaluator_interpretation": ""
    }
  ],
  "priority_actions": []
}
\`\`\`

Compatibility note: this API enforces the JSON object above with structured outputs. If the rubric is unclear, set agency_detected to "RubricMismatch", funding_decision to "Do Not Select", fit_score and quality_score to 0, criteria to an empty array, primary_failure_reason and most_likely_rejection_issue to the rubric mismatch, weakness_rankings to an empty array, and include "RubricMismatch: Unable to confidently determine agency rubric." in flags.`;

const listSchema = {
  type: "array",
  items: { type: "string" },
};

const weaknessRankingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "severity",
    "weakness",
    "selection_impact",
    "consequence_if_not_fixed",
    "why_prevents_funding",
    "evaluator_interpretation",
  ],
  properties: {
    severity: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
    weakness: { type: "string" },
    selection_impact: { type: "string" },
    consequence_if_not_fixed: { type: "string" },
    why_prevents_funding: { type: "string" },
    evaluator_interpretation: { type: "string" },
  },
};

const criterionEvaluationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "score", "evidence_present", "evidence_anchor", "reason", "gap", "fix"],
  properties: {
    name: { type: "string" },
    score: { type: "number" },
    evidence_present: { type: "string", enum: ["Yes", "No"] },
    evidence_anchor: { type: "string" },
    reason: { type: "string" },
    gap: { type: "string" },
    fix: { type: "string" },
  },
};

const evaluationSchema = {
  type: "json_schema",
  name: "multi_agency_proposal_evaluation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "agency_detected",
      "fit_score",
      "quality_score",
      "funding_decision",
      "decision_rationale",
      "primary_failure_reason",
      "most_likely_rejection_issue",
      "confidence",
      "confidence_reason",
      "flags",
      "criteria",
      "top_strengths",
      "top_weaknesses",
      "weakness_rankings",
      "priority_actions",
    ],
    properties: {
      agency_detected: { type: "string" },
      fit_score: { type: "number" },
      quality_score: { type: "number" },
      funding_decision: { type: "string", enum: ["Select", "Do Not Select"] },
      decision_rationale: { type: "string" },
      primary_failure_reason: { type: "string" },
      most_likely_rejection_issue: { type: "string" },
      confidence: { type: "string", enum: ["High", "Moderate", "Low"] },
      confidence_reason: { type: "string" },
      flags: listSchema,
      criteria: {
        type: "array",
        items: criterionEvaluationSchema,
      },
      top_strengths: listSchema,
      top_weaknesses: listSchema,
      weakness_rankings: {
        type: "array",
        items: weaknessRankingSchema,
      },
      priority_actions: listSchema,
    },
  },
} as const;

const parseRequestBody = (body: unknown): unknown => {
  if (typeof body !== "string") return body;
  return JSON.parse(body);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEvaluateInput = (value: unknown): value is EvaluateInput => {
  if (!isRecord(value) || !isRecord(value.project)) return false;
  return typeof value.solicitationText === "string" && typeof value.proposalText === "string";
};

const truncate = (value: string, maxLength: number) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}\n\n[Input truncated for evaluation length.]`;
};

const getReasoningEffort = (value: string | undefined): ReasoningEffort => {
  if (value && REASONING_EFFORTS.has(value as ReasoningEffort)) {
    return value as ReasoningEffort;
  }

  return "low";
};

const ensureStringList = (value: unknown, fallback: string): string[] => {
  if (!Array.isArray(value)) return [fallback];
  const items = value.map((item) => String(item).trim()).filter(Boolean);
  return items.length ? items : [fallback];
};

const optionalStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const clampRubricScore = (value: unknown) => {
  const score = Math.round(Number(value));
  return Number.isFinite(score) ? Math.min(5, Math.max(1, score)) : 1;
};

const clampPercentScore = (value: unknown) => {
  const score = Math.round(Number(value));
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
};

const toStringValue = (value: unknown, fallback: string) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
};

const normalizeConfidence = (value: unknown): MultiAgencyEvaluation["confidence"] => {
  return value === "High" || value === "Moderate" || value === "Low" ? value : "Low";
};

const normalizeFundingDecision = (
  value: unknown,
  fitScore: number,
  qualityScore: number,
  confidence: MultiAgencyEvaluation["confidence"],
): MultiAgencyEvaluation["funding_decision"] => {
  if (value === "Select" || value === "Do Not Select") return value;
  return fitScore >= 85 && qualityScore >= 85 && confidence === "High" ? "Select" : "Do Not Select";
};

const normalizeWeaknessSeverity = (value: unknown): MultiAgencyEvaluation["weakness_rankings"][number]["severity"] => {
  return value === "Critical" || value === "High" || value === "Medium" || value === "Low" ? value : "High";
};

const normalizeEvidencePresent = (value: unknown): "Yes" | "No" => (value === "Yes" ? "Yes" : "No");

const criterionKey = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("commercial")) return "commercialization";
  if (normalized.includes("defense") || normalized.includes("mission relevance")) return "defenseNeed";
  if (normalized.includes("technical")) return "technicalMerit";

  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "criterion";
};

const normalizeMultiAgencyEvaluation = (value: unknown): MultiAgencyEvaluation => {
  if (!isRecord(value)) {
    throw new Error("OpenAI returned an unexpected evaluation format.");
  }

  const fitScore = clampPercentScore(value.fit_score);
  const qualityScore = clampPercentScore(value.quality_score);
  const confidence = normalizeConfidence(value.confidence);
  const fundingDecision = normalizeFundingDecision(value.funding_decision, fitScore, qualityScore, confidence);

  const criteria = Array.isArray(value.criteria)
    ? value.criteria.filter(isRecord).map((criterion) => ({
        name: toStringValue(criterion.name, "Criterion"),
        score: clampRubricScore(criterion.score),
        evidence_present: normalizeEvidencePresent(criterion.evidence_present),
        evidence_anchor: toStringValue(criterion.evidence_anchor, "No evidence anchor provided."),
        reason: toStringValue(criterion.reason, "No score rationale provided."),
        gap: toStringValue(criterion.gap, "No gap provided."),
        fix: toStringValue(criterion.fix, "Add specific, evidence-backed detail for this criterion."),
      }))
    : [];
  const topWeaknesses = ensureStringList(value.top_weaknesses, "The draft needs clearer evidence and specificity.");
  const fallbackWeaknessRankings = topWeaknesses.map((weakness, index) => ({
    severity: (index === 0 ? "Critical" : "High") as MultiAgencyEvaluation["weakness_rankings"][number]["severity"],
    weakness,
    selection_impact:
      index === 0
        ? "This is the primary selection risk because it limits evaluator confidence in mission success or transition."
        : "This is a major selection risk because it reduces competitiveness against stronger submissions.",
    consequence_if_not_fixed: "The proposal remains vulnerable to rejection against better-evidenced submissions.",
    why_prevents_funding: "Limited budget slots favor proposals with clearer evidence, lower deployment risk, and a stronger transition path.",
    evaluator_interpretation: "Evaluators interpret the gap as unresolved risk rather than a minor drafting issue.",
  }));
  const weaknessRankings = Array.isArray(value.weakness_rankings)
    ? value.weakness_rankings
        .filter(isRecord)
        .map((weakness) => ({
          severity: normalizeWeaknessSeverity(weakness.severity),
          weakness: toStringValue(weakness.weakness, "Selection weakness not specified."),
          selection_impact: toStringValue(
            weakness.selection_impact,
            "This weakness reduces confidence in selection against stronger submissions.",
          ),
          consequence_if_not_fixed: toStringValue(
            weakness.consequence_if_not_fixed,
            "The proposal remains vulnerable to rejection if this is not fixed.",
          ),
          why_prevents_funding: toStringValue(
            weakness.why_prevents_funding,
            "Limited funding should go to proposals with clearer mission impact, transition path, and deployment risk reduction.",
          ),
          evaluator_interpretation: toStringValue(
            weakness.evaluator_interpretation,
            "Evaluators interpret this as unresolved execution or transition risk.",
          ),
        }))
    : [];
  const rankedWeaknesses = weaknessRankings.length ? weaknessRankings : fallbackWeaknessRankings;
  const primaryFailureReason = toStringValue(
    value.primary_failure_reason,
    rankedWeaknesses[0]?.weakness ?? "Insufficient evidence that the proposal can achieve mission success and transition.",
  );

  return {
    agency_detected: toStringValue(value.agency_detected, "RubricMismatch"),
    fit_score: fitScore,
    quality_score: qualityScore,
    funding_decision: fundingDecision,
    decision_rationale: toStringValue(
      value.decision_rationale,
      fundingDecision === "Select"
        ? "Select because the proposal clears mission relevance, transition, and deployment-risk thresholds."
        : "Do Not Select because mission relevance, transition path, or deployment risk is not strong enough to beat top-tier proposals.",
    ),
    primary_failure_reason: primaryFailureReason,
    most_likely_rejection_issue: toStringValue(value.most_likely_rejection_issue, primaryFailureReason),
    confidence,
    confidence_reason: toStringValue(value.confidence_reason, "Confidence is limited by the available evidence."),
    flags: optionalStringList(value.flags),
    criteria,
    top_strengths: ensureStringList(value.top_strengths, "No major strengths were identified."),
    top_weaknesses: topWeaknesses,
    weakness_rankings: rankedWeaknesses,
    priority_actions: ensureStringList(value.priority_actions, "Add measurable evidence tied to the selected agency rubric."),
  };
};

const formatRankedWeakness = (weakness: MultiAgencyEvaluation["weakness_rankings"][number]) =>
  `${weakness.severity}: ${weakness.weakness} ${weakness.selection_impact} If not fixed, ${weakness.consequence_if_not_fixed} Funding impact: ${weakness.why_prevents_funding} Evaluator read: ${weakness.evaluator_interpretation}`;

const normalizeEvaluation = (value: unknown): EvaluationResult => {
  const multiAgencyEvaluation = normalizeMultiAgencyEvaluation(value);
  const rubricMismatch =
    multiAgencyEvaluation.agency_detected === "RubricMismatch" ||
    multiAgencyEvaluation.flags.some((flag) => flag.startsWith("RubricMismatch"));
  const readinessScore = rubricMismatch
    ? 0
    : Math.round((multiAgencyEvaluation.fit_score + multiAgencyEvaluation.quality_score) / 2);
  const rubricScores = multiAgencyEvaluation.criteria.map((criterion) => ({
    key: criterionKey(criterion.name),
    title: criterion.name,
    score: criterion.score,
    label: getDafAfwerxRatingLabel(criterion.score),
    rationale: criterion.reason,
    strengths:
      criterion.evidence_present === "Yes"
        ? [criterion.evidence_anchor]
        : [`No direct evidence was identified for ${criterion.name}.`],
    gaps: [criterion.gap, criterion.fix],
  }));
  const criteriaGaps = multiAgencyEvaluation.criteria.flatMap((criterion) => [
    `${criterion.name}: ${criterion.gap}`,
    `${criterion.name} fix: ${criterion.fix}`,
  ]);
  const technicalMerit = multiAgencyEvaluation.criteria
    .filter((criterion) => /technical|intellectual merit|innovation|approach/i.test(criterion.name))
    .map((criterion) => `${criterion.name}: ${criterion.reason} Fix: ${criterion.fix}`);
  const commercialization = multiAgencyEvaluation.criteria
    .filter((criterion) => /commercial|broader impacts|impact/i.test(criterion.name))
    .map((criterion) => `${criterion.name}: ${criterion.reason} Fix: ${criterion.fix}`);
  const transitionPotential = multiAgencyEvaluation.criteria
    .filter((criterion) => /defense|mission|nasa|significance|environment|team|investigator/i.test(criterion.name))
    .map((criterion) => `${criterion.name}: ${criterion.reason} Fix: ${criterion.fix}`);

  return {
    generatedAt: new Date().toISOString(),
    readinessScore,
    confidenceNote: [
      `Agency detected: ${multiAgencyEvaluation.agency_detected}.`,
      `Funding decision: ${multiAgencyEvaluation.funding_decision}.`,
      `Fit Score: ${multiAgencyEvaluation.fit_score}/100.`,
      `Quality Score: ${multiAgencyEvaluation.quality_score}/100.`,
      `Confidence: ${multiAgencyEvaluation.confidence}.`,
      `Primary failure driver: ${multiAgencyEvaluation.primary_failure_reason}.`,
      multiAgencyEvaluation.confidence_reason,
    ].join(" "),
    multiAgencyEvaluation,
    rubricScores,
    costVolumeChecks: undefined,
    strengths: multiAgencyEvaluation.top_strengths,
    weaknesses: multiAgencyEvaluation.weakness_rankings.length
      ? multiAgencyEvaluation.weakness_rankings.map(formatRankedWeakness)
      : multiAgencyEvaluation.top_weaknesses,
    complianceGaps: [...multiAgencyEvaluation.flags, ...criteriaGaps].filter(Boolean),
    technicalMerit: technicalMerit.length
      ? technicalMerit
      : ["No technical or approach-specific rubric feedback was returned for the selected agency."],
    commercialization: commercialization.length
      ? commercialization
      : ["No commercialization, impact, or broader-impact rubric feedback was returned for the selected agency."],
    transitionPotential: transitionPotential.length
      ? transitionPotential
      : ["No mission, customer, team, or environment-specific rubric feedback was returned for the selected agency."],
    rewriteActions: multiAgencyEvaluation.priority_actions,
  };
};

const buildEvaluationInput = ({ project, solicitationText, proposalText }: EvaluateInput) => ({
  project: {
    name: project.name,
    agency: project.agency,
    program: project.program,
    phase: project.phase,
    topicId: project.topicId,
    dueDate: project.dueDate,
  },
  solicitationText: truncate(solicitationText, MAX_SOLICITATION_CHARS),
  proposalText: truncate(proposalText, MAX_PROPOSAL_CHARS),
});

export const evaluateProposalWithOpenAI = async (input: EvaluateInput): Promise<EvaluationResult> => {
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
        content: MULTI_AGENCY_EVALUATOR_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify(buildEvaluationInput(input)),
      },
    ],
    max_output_tokens: 4200,
    reasoning: model.startsWith("gpt-5") ? { effort: reasoningEffort } : undefined,
    text: {
      format: evaluationSchema,
      verbosity: "medium",
    },
  });

  const output = response.output_text;
  if (!output) {
    throw new Error("OpenAI returned an empty evaluation.");
  }

  const evaluation = normalizeEvaluation(JSON.parse(output));
  return {
    ...evaluation,
    generatedAt: new Date().toISOString(),
  };
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

  if (!isEvaluateInput(input)) {
    res.status(400).json({ error: "Request must include project, solicitationText, and proposalText." });
    return;
  }

  try {
    res.status(200).json(await evaluateProposalWithOpenAI(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI evaluation failed.";
    if (error instanceof Error && error.name === "OPENAI_API_KEY_MISSING") {
      res.status(500).json({ code: error.name, error: message });
      return;
    }

    res.status(502).json({ error: message });
  }
}
