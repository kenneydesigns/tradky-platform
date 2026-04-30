import { DraftSectionsInput, DraftSectionsResult, EvaluateInput, EvaluationResult, VolumeSectionKey } from "../types";

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

const sourceSentence = (value: string, fallback: string) => sentence(value, fallback).replace(/\.$/, "");

const sectionDrafts = ({
  project,
}: DraftSectionsInput): Record<VolumeSectionKey, string> => {
  const problemSource = sourceSentence(
    project.solicitationText,
    `${project.agency} ${project.program} ${project.phase} topic ${project.topicId || "opportunity"}`,
  );
  const proposalSource = sourceSentence(project.proposalText, "the current concept notes and technical direction");
  const transitionSource =
    project.evaluation?.transitionPotential.join(" ") ||
    "the most likely mission owner, operating environment, and acquisition path";
  const technicalActions =
    project.evaluation?.technicalMerit.join(" ") ||
    "the technical hypothesis, baseline performance, validation method, and measurable success criteria";
  const rewriteActions =
    project.evaluation?.rewriteActions.join(" ") ||
    "reviewer-facing claims, evidence, milestones, and decision points";

  return {
    problemNeed: [
      `The proposed ${project.phase} effort addresses a practical gap reflected in ${problemSource}.`,
      `Current approaches do not give reviewers enough confidence that the mission need can be met with available cost, schedule, or performance constraints.`,
      `This section should quantify the affected users, operational pain, performance shortfall, and urgency so the need is clear before the technical solution is introduced.`,
    ].join("\n\n"),
    technicalApproach: [
      `Our technical approach turns ${proposalSource} into a testable development path.`,
      `The work will define the system architecture, identify key technical assumptions, and validate feasibility through experiments tied to measurable thresholds.`,
      `The draft should make ${technicalActions} explicit, then connect each claim to the data the team will collect during ${project.phase}.`,
    ].join("\n\n"),
    innovation: [
      `The innovation is the combination of method, implementation, and transition fit that improves on incumbent alternatives for this ${project.agency} use case.`,
      `Rather than presenting novelty as a general claim, the section should compare the proposed approach against current products, research baselines, and internal workarounds.`,
      `The strongest version will explain what is technically differentiated, why it is defensible, and what evidence would prove that differentiation during the award period.`,
    ].join("\n\n"),
    workPlan: [
      `The ${project.phase} work plan should be organized around tasks that retire the highest feasibility risks first.`,
      `Task 1 should refine requirements and success criteria; Task 2 should build or integrate the prototype elements; Task 3 should run validation experiments and analyze results; Task 4 should prepare the transition and Phase II evidence package.`,
      `Each task needs objectives, deliverables, responsible contributors, timing, and go/no-go criteria tied to ${rewriteActions}.`,
    ].join("\n\n"),
    team: [
      `The team section should map each contributor to the work they directly own, including technical execution, customer discovery, commercialization, and transition planning.`,
      `For ${project.name}, reviewers should see who is accountable for architecture, experimentation, program management, security or regulatory constraints, and buyer engagement.`,
      `Any gaps should be addressed through advisors, subcontractors, hiring milestones, or partner commitments instead of left implicit.`,
    ].join("\n\n"),
    commercializationTransition: [
      `Commercialization and transition should describe the path from prototype evidence to adoption, not just a market opportunity.`,
      `For this project, the draft should identify target users, first use cases, buyer type, procurement trigger, and the ${project.agency} stakeholder most likely to sponsor follow-on activity.`,
      `Use the evaluation guidance as source material: ${transitionSource}.`,
    ].join("\n\n"),
    risks: [
      `The risk section should make the proposal feel controlled and executable.`,
      `List the highest technical, schedule, budget, regulatory, security, and adoption risks, then pair each with likelihood, impact, mitigation, fallback plan, and evidence the team will collect.`,
      `The strongest risks are specific to ${project.name} and tied to task-level decision points, not generic project management language.`,
    ].join("\n\n"),
    budgetNarrative: [
      `The budget narrative should explain why each cost is necessary to complete the technical work plan.`,
      `Labor should be connected to task ownership, materials and software to prototype or test needs, travel to customer or transition activities, and subcontractors to specialized capabilities the core team does not provide.`,
      `Close the section by tying cost realism to expected deliverables and the evidence package needed for the next funding or adoption decision.`,
    ].join("\n\n"),
  };
};

export const generateMockDraftSections = async (input: DraftSectionsInput): Promise<DraftSectionsResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 700));

  const drafts = sectionDrafts(input);
  const selectedKeys = new Set(input.sectionKeys ?? input.project.sections.map((section) => section.key));

  return {
    generatedAt: new Date().toISOString(),
    sections: input.project.sections
      .filter((section) => selectedKeys.has(section.key))
      .map((section) => ({
        ...section,
        content: drafts[section.key],
      })),
  };
};
