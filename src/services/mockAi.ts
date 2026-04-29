import { EvaluateInput, EvaluationResult } from "../types";

const sentence = (text: string, fallback: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;

  const first = cleaned.split(/[.!?]\s/)[0];
  return first.length > 180 ? `${first.slice(0, 177)}...` : first;
};

const contains = (text: string, terms: string[]) => terms.some((term) => text.toLowerCase().includes(term));

export const generateMockEvaluation = async ({
  project,
  solicitationText,
  proposalText,
}: EvaluateInput): Promise<EvaluationResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  const combined = `${solicitationText} ${proposalText}`;
  const hasTransition = contains(combined, ["transition", "customer", "program office", "pm", "warfighter"]);
  const hasCommercial = contains(combined, ["market", "commercial", "revenue", "pricing", "sales", "tam"]);
  const hasMetrics = contains(combined, ["metric", "threshold", "kpi", "trl", "success criteria", "test"]);
  const hasBudget = contains(combined, ["budget", "cost", "labor", "materials", "subcontract"]);
  const hasRisk = contains(combined, ["risk", "mitigation", "dependency", "fallback"]);
  const baseScore = 56;
  const score =
    baseScore +
    (hasTransition ? 10 : 0) +
    (hasCommercial ? 8 : 0) +
    (hasMetrics ? 10 : 0) +
    (hasBudget ? 6 : 0) +
    (hasRisk ? 5 : 0) +
    Math.min(8, Math.floor(proposalText.length / 1500));

  return {
    generatedAt: new Date().toISOString(),
    readinessScore: Math.min(score, 94),
    confidenceNote:
      "Mock evaluation based on text completeness and common SBIR/STTR review criteria. Replace with a server-side AI endpoint before production use.",
    strengths: [
      `${project.name} presents a focused starting point around ${sentence(
        proposalText,
        "the proposed technical effort",
      )}.`,
      hasMetrics
        ? "The draft includes measurable language that can support a stronger technical merit argument."
        : "The draft has room to add measurable success criteria, which is a straightforward improvement path.",
      solicitationText.length > 500
        ? "The solicitation text is substantial enough to support compliance mapping."
        : "The project workflow is ready to accept a fuller solicitation for tighter compliance review.",
    ],
    weaknesses: [
      hasTransition
        ? "The transition story is present but should be tied to named stakeholders, acquisition pathways, and post-award milestones."
        : "The transition story is thin and needs a clearer path from prototype to DoD use.",
      hasCommercial
        ? "The commercialization section should quantify market size, buyer urgency, and pricing assumptions."
        : "Commercialization language is missing or underdeveloped for a competitive SBIR/STTR package.",
      "The technical narrative should make reviewer-facing claims easier to verify with tests, milestones, and acceptance criteria.",
    ],
    complianceGaps: [
      "Create a requirement-by-requirement compliance matrix against the solicitation and topic language.",
      hasBudget
        ? "Tie budget line items to work plan tasks and expected technical outputs."
        : "Add a budget narrative that explains labor, materials, subcontractors, and cost realism.",
      "Confirm page limits, formatting rules, required attachments, data rights assertions, and commercialization plan requirements.",
    ],
    technicalMerit: [
      "State the technical hypothesis in one concise paragraph before describing the architecture or method.",
      "Define baseline performance, target performance, and the test method reviewers can use to judge feasibility.",
      "Make the innovation defensible against current alternatives, not just internally novel.",
    ],
    commercialization: [
      hasCommercial
        ? "Convert market claims into an adoption model with buyer type, procurement trigger, and expected revenue path."
        : "Add target markets, use cases, buyer personas, competitive alternatives, and a first revenue strategy.",
      "Describe partnerships, pilots, licensing, manufacturing, or services needed after the SBIR/STTR period.",
    ],
    transitionPotential: [
      hasTransition
        ? "Name the DoD transition owner, operational environment, and likely program insertion point."
        : "Identify a DoD customer, mission owner, operational pain point, and transition milestone.",
      "Connect the Phase I/II work plan to TRL advancement and acquisition relevance.",
    ],
    rewriteActions: [
      "Open the technical volume with the mission need, quantified pain, and why current approaches fall short.",
      "Turn the work plan into task-level objectives with deliverables, success metrics, and review gates.",
      "Add a risk table with technical, schedule, budget, regulatory, security, and adoption risks plus mitigations.",
      "Rewrite commercialization and transition as a single path from prototype evidence to customer adoption.",
      "Use solicitation language in section headings and evaluator-facing claims where appropriate.",
    ],
  };
};
