import {
  DAF_AFWERX_COST_VOLUME_CHECKS,
  DAF_AFWERX_RUBRIC,
  getDafAfwerxRatingLabel,
  getDafAfwerxReadinessScore,
} from "../data/dafAfwerxRubric";
import {
  DraftSectionsInput,
  DraftSectionsResult,
  EvaluateInput,
  EvaluationResult,
  SectionSuggestionsInput,
  SectionSuggestionsResult,
  VolumeSection,
  VolumeSectionKey,
} from "../types";
import { analyzeSectionStrength } from "../utils/sectionStrength";

const sentence = (text: string, fallback: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;

  const first = cleaned.split(/[.!?]\s/)[0];
  return first.length > 180 ? `${first.slice(0, 177)}...` : first;
};

const contains = (text: string, terms: string[]) => terms.some((term) => text.toLowerCase().includes(term));

const scoreFromSignals = (...signals: boolean[]) => Math.min(5, Math.max(1, 1 + signals.filter(Boolean).length));

const rubricScore = (
  key: "commercialization" | "defenseNeed" | "technicalMerit",
  score: number,
  rationale: string,
  strengths: string[],
  gaps: string[],
) => {
  const category = DAF_AFWERX_RUBRIC.find((item) => item.key === key);
  const normalizedScore = Math.min(5, Math.max(1, Math.round(score)));

  return {
    key,
    title: category?.title ?? key,
    score: normalizedScore,
    label: getDafAfwerxRatingLabel(normalizedScore),
    rationale,
    strengths,
    gaps,
  };
};

const costCheck = (question: string, status: "YES" | "NO" | "N/A", rationale: string) => ({
  question,
  status,
  rationale,
});

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
  const hasDefenseNeed = contains(combined, ["mission", "operational", "capability gap", "warfighter", "airmen", "guardian"]);
  const hasUrgency = contains(combined, ["urgent", "immediate", "critical", "current", "near-term"]);
  const hasBreadth = contains(combined, ["majcom", "field command", "multiple units", "bases", "platforms", "airframes"]);
  const hasUseCase = contains(combined, ["use case", "operational application", "end user", "customer", "stakeholder"]);
  const hasBusinessPlan = contains(combined, ["business plan", "go-to-market", "pricing", "sales", "channel", "profit"]);
  const hasPrivateInterest = contains(combined, ["investor", "non-government", "private", "revenue", "pilot", "partner"]);
  const hasTechnicalApproach = contains(combined, ["approach", "architecture", "prototype", "algorithm", "model", "system"]);
  const hasInnovation = contains(combined, ["novel", "innovative", "unique", "state of the art", "cutting edge"]);
  const hasTeam = contains(combined, ["team", "pi", "principal investigator", "engineer", "scientist", "experience", "expertise"]);

  const commercializationScore = scoreFromSignals(hasCommercial, hasBusinessPlan, hasPrivateInterest, hasTransition);
  const defenseNeedScore = scoreFromSignals(hasDefenseNeed, hasUrgency, hasBreadth, hasUseCase);
  const technicalMeritScore = scoreFromSignals(hasUseCase, hasTechnicalApproach, hasMetrics, hasRisk, hasInnovation || hasTeam);
  const rubricScores = [
    rubricScore(
      "commercialization",
      commercializationScore,
      "Mock DAF/AFWERX Commercialization rating based on market/revenue, business-plan, defense/private interest, and transition evidence in the draft.",
      [
        hasCommercial
          ? "Includes market or revenue evidence relevant to Market and Revenue Potential."
          : "Commercialization can be improved by adding market and revenue evidence.",
        hasPrivateInterest
          ? "Shows defense, investor, non-government revenue, pilot, or partner interest."
          : "Defense/private interest evidence is limited or absent.",
      ],
      [
        hasBusinessPlan
          ? "Business-plan logic is present but should be made more evaluator-verifiable."
          : "Business Plan score is limited without a clear path to revenue capture and commercial viability.",
        hasTransition
          ? "Transition language should still specify funding source, customer, and next milestone."
          : "Transition strategy is not strong enough for higher Commercialization confidence.",
      ],
    ),
    rubricScore(
      "defenseNeed",
      defenseNeedScore,
      "Mock DAF/AFWERX Defense Need rating based on mission impact, urgency, breadth of applicability, and specificity of the defense use case.",
      [
        hasDefenseNeed
          ? "Addresses a defense mission or capability-gap need."
          : "Defense Need can be improved by naming the operational need and capability gap.",
        hasUseCase ? "Includes an end-user or use-case signal." : "Use case evidence is thin.",
      ],
      [
        hasUrgency
          ? "Urgency is present; quantify the operational consequence to strengthen the rating."
          : "Level of Mission Impact and Urgency is limited without immediate or critical need evidence.",
        hasBreadth
          ? "Breadth language is present but should clarify units, platforms, bases, or commands affected."
          : "Breadth of Applicability is limited without evidence beyond a single narrow use.",
      ],
    ),
    rubricScore(
      "technicalMerit",
      technicalMeritScore,
      "Mock DAF/AFWERX Technical Merit rating based on problem/use-case framing, approach soundness, risk, innovation, and team evidence.",
      [
        hasTechnicalApproach
          ? "Technical approach evidence is present."
          : "Technical Merit can be improved by adding a sound, logical technical approach.",
        hasMetrics ? "Includes metrics, thresholds, tests, or success criteria." : "Measurable validation evidence is thin.",
      ],
      [
        hasRisk ? "Risk evidence is present; tie mitigations to specific tasks and residual risks." : "Level of Risk score is limited without identified risks and mitigation plans.",
        hasTeam ? "Team qualifications are referenced; map expertise to execution roles." : "Team Qualifications are not strong enough to support a high Technical Merit rating.",
      ],
    ),
  ];
  const readinessScore = getDafAfwerxReadinessScore(rubricScores.map((score) => score.score));
  const costVolumeChecks = [
    costCheck(
      DAF_AFWERX_COST_VOLUME_CHECKS[0],
      contains(combined, ["materials", "equipment", "hardware", "software"]) ? "YES" : hasBudget ? "NO" : "N/A",
      "Mock assessment of whether materials/equipment are tied to the technical effort.",
    ),
    costCheck(
      DAF_AFWERX_COST_VOLUME_CHECKS[1],
      contains(combined, ["labor", "personnel", "hours", "level of effort"]) ? "YES" : hasBudget ? "NO" : "N/A",
      "Mock assessment of personnel, labor mix, and hours.",
    ),
    costCheck(
      DAF_AFWERX_COST_VOLUME_CHECKS[2],
      contains(combined, ["testing", "analysis", "machining", "milling", "lease"]) ? "YES" : "N/A",
      "Mock assessment of specialized technical efforts.",
    ),
    costCheck(
      DAF_AFWERX_COST_VOLUME_CHECKS[3],
      contains(combined, ["travel", "site visit", "customer visit"]) ? "YES" : "N/A",
      "Mock assessment of travel relevance.",
    ),
    costCheck(
      DAF_AFWERX_COST_VOLUME_CHECKS[4],
      contains(combined, ["subcontract", "consultant", "advisor"]) ? "YES" : "N/A",
      "Mock assessment of subcontractor or consultant appropriateness.",
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    readinessScore,
    confidenceNote:
      "Mock evaluation using the DAF/AFWERX 2024 MTE rubric: equal-weighted Commercialization, Defense Need, and Technical Merit ratings. Replace with the server-side AI endpoint before production use.",
    rubricScores,
    costVolumeChecks,
    strengths: [
      `${project.name} presents a focused starting point around ${sentence(
        proposalText,
        "the proposed technical effort",
      )}.`,
      hasMetrics
        ? "The draft includes measurable language that can support the DAF/AFWERX Technical Merit rating."
        : "The draft can raise Technical Merit by adding tests, thresholds, and success criteria.",
      solicitationText.length > 500
        ? "The solicitation text is substantial enough to map proposal claims against DAF/AFWERX criteria."
        : "The project workflow is ready to accept fuller topic instructions for tighter DAF/AFWERX review.",
    ],
    weaknesses: [
      hasTransition
        ? "Transition story is present but needs stronger customer, funding, and milestone evidence for Commercialization."
        : "Commercialization is score-limited without a clear transition strategy, customer interest, or funding path.",
      hasCommercial
        ? "Commercialization should quantify market size, revenue potential, buyer urgency, and commercial viability."
        : "Market and Revenue Potential and Business Plan evidence are missing or underdeveloped.",
      "Technical Merit claims should be easier to verify with objectives, tests, relevant details, risks, and mitigations.",
    ],
    complianceGaps: [
      "Create a requirement-by-requirement map against the topic language and DAF/AFWERX rubric criteria.",
      hasBudget
        ? "Tie budget line items to the proposed technical effort for the Cost Volume checks."
        : "Add cost-volume evidence for labor, materials/equipment, specialized efforts, travel, and subcontractors where applicable.",
      "Confirm required attachments, CM/supporting documents for Phase II, signatures, milestones, and formatting rules.",
    ],
    technicalMerit: [
      "Make the problem and end-user use cases clear before describing the technical approach.",
      "Define baseline performance, target performance, and the test method evaluators can use to judge approach soundness.",
      "Make innovation defensible against the current state of the art and similar solutions.",
    ],
    commercialization: [
      hasCommercial
        ? "Convert market claims into a business plan with revenue capture, commercial viability, and buyer type."
        : "Add market opportunity, revenue potential, customer segment, and commercial viability evidence.",
      "Describe defense customer interest, available funding, investor interest, non-government revenue, pilots, or partner traction.",
    ],
    transitionPotential: [
      hasTransition
        ? "Name the DAF customer, operational environment, available funds, and transition milestone."
        : "Identify a Defense customer, end user, operational pain point, and transition strategy.",
      "Connect the work plan to the Defense Need criteria: mission impact, breadth of applicability, use case specificity, and adequacy of effort.",
    ],
    rewriteActions: [
      "Open with Defense Need: immediate operational need, capability gap, mission impact, and specific end-user use case.",
      "Turn the technical approach into objectives, relevant details, tests, deliverables, risks, mitigations, and review gates.",
      "Rewrite commercialization around market/revenue potential, business plan, defense/private interest, and transition strategy.",
      "Add cost-volume justification that maps labor, materials/equipment, specialized efforts, travel, and subcontractors to the technical effort.",
      "Use DAF/AFWERX rubric language in reviewer-facing claims where it accurately matches the evidence.",
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

const sectionSuggestionFallbacks: Record<VolumeSectionKey, string[]> = {
  problemNeed: [
    "Does not clearly map to DAF/AFWERX Defense Need: mission impact, urgency, and defense capability gap are not evaluator-obvious.",
    "Lacks a specific end-user use case with clear operational application and adequacy of effort.",
    "Breadth of Applicability is weak unless the draft shows affected units, platforms, bases, MAJCOMs, or Field Commands.",
  ],
  technicalApproach: [
    "Fails to demonstrate Technical Approach Soundness and Merit with a logical method tied to stated objectives.",
    "Lacks relevant technical details, tests, thresholds, or success criteria that support a higher Technical Merit score.",
    "Does not make clear how the approach will deliver the stated DAF/AFWERX objectives.",
  ],
  innovation: [
    "Innovation score is limited because the solution is not compared to the current state of the art or similar companies.",
    "Does not show whether the technology is brand-new to government or an adaptation of existing government technology.",
    "Novelty claims need evidence that the solution is unique, original, or cutting edge.",
  ],
  workPlan: [
    "Technical Merit is limited unless tasks show how the approach will deliver stated objectives.",
    "Milestones should be consistent with any customer memo, transition strategy, and proposed technical effort.",
    "Risk retirement should be visible in the work plan so evaluators can judge whether residual risk is acceptable.",
  ],
  team: [
    "Team Qualifications score is limited unless relevant experience, expertise, facilities, and equipment are tied to the work.",
    "Does not demonstrate the team's ability to perform R&D and execute the proposed approach.",
    "Uncovered capabilities need an advisor, partner, subcontractor, facility, or hiring plan instead of an implicit gap.",
  ],
  commercializationTransition: [
    "Fails to demonstrate Commercialization through market/revenue potential, business plan, and defense/private interest.",
    "Defense customer interest is score-limited unless the customer, available funds, investor funding, or non-government revenue are clear.",
    "Transition strategy needs enough specificity to support the Phase II CM/supporting-document criteria when applicable.",
  ],
  risks: [
    "Level of Risk score is limited unless major risks are identified and mitigated.",
    "Residual risks should be framed as acceptable for an SBIR/STTR R&D effort, or explicitly reduced by mitigation evidence.",
    "Risk mitigation should tie to work plan tasks, tests, and decision gates.",
  ],
  budgetNarrative: [
    "Cost Volume logic is weak unless materials/equipment are appropriate for the proposed technical effort.",
    "Personnel, labor skill mix, and hours need to map to the proposed technical effort.",
    "Travel, specialized efforts, subcontractors, and consultants need clear relevance or should be marked not applicable.",
  ],
};

const signalRiskFindings: Record<string, string> = {
  "named user or mission owner": "Defense Need is score-limited because the end user, customer, or mission owner is not clear.",
  "clear problem gap": "Problem framing does not yet establish the defense capability gap or operational consequence.",
  urgency: "Level of Mission Impact and Urgency is weak without immediate or critical need evidence.",
  "technical method": "Technical Approach Soundness and Merit is limited because the method or architecture is not clear.",
  "validation plan": "Technical Merit is limited without tests, data sources, objectives, and pass/fail criteria.",
  "measurable criteria": "Lacks measurable objectives needed to judge whether the approach can deliver stated results.",
  "novelty claim": "Innovation score is limited because novelty compared with current state of the art is not explicit.",
  "comparison to alternatives": "Innovation score is limited without comparison to similar solutions or existing government technology.",
  defensibility: "Innovation evidence is not strong enough to show a unique or original advantage.",
  "task structure": "Technical approach is harder to score because tasks and objectives are not structured.",
  deliverables: "Evaluator cannot see the concrete outputs that will prove technical progress.",
  "timing or decision gates": "Milestone consistency and risk retirement are weak without timing or decision gates.",
  "named roles": "Team Qualifications are score-limited because execution roles are not named.",
  "relevant qualifications": "Team Qualifications need experience, expertise, facilities, or equipment tied to the proposed approach.",
  "ownership mapping": "Evaluator cannot see who owns technical execution, commercialization, transition, or customer engagement.",
  "target customer or market": "Commercialization score is limited because market, customer, or revenue target is vague.",
  "transition path": "Commercialization and Defense Need are limited without a clear transition strategy or customer funding path.",
  "commercial adoption path": "Commercialization lacks investor funding, non-government revenue, pilot, partner, or revenue evidence.",
  "specific risks": "Level of Risk is hard to score because major risks are not identified.",
  mitigations: "Level of Risk is limited because mitigation plans are missing or generic.",
  "fallback or impact": "Residual risk is hard to judge without impact, likelihood, fallback, or mitigation evidence.",
  "labor basis": "Cost Volume check is limited because personnel, skill mix, and hours are not visible.",
  "cost categories": "Cost Volume check is limited because materials, equipment, travel, or subcontractors are not justified.",
  "cost-to-work link": "Cost Volume check is limited because costs are not mapped to the proposed technical effort.",
};

const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const scoreEvaluatorSection = (section: VolumeSection, completenessScore: number) => {
  const content = section.content.trim();
  if (!content) return 0;

  const reviewerSignals = [
    { pattern: /\b(solicitation|topic|requirement|criterion|criteria)\b/i, points: 12 },
    { pattern: /\b(dod|warfighter|mission|program office|acquisition|transition)\b/i, points: 15 },
    { pattern: /\b\d+(?:\.\d+)?%?\b|metric|threshold|baseline|kpi|trl|performance\b/i, points: 16 },
    { pattern: /\b(test|validate|evidence|demonstrate|deliverable|milestone)\b/i, points: 14 },
    { pattern: /\b(customer|buyer|user|stakeholder|partner|pilot)\b/i, points: 11 },
    { pattern: /\b(risk|mitigation|fallback|assumption)\b/i, points: 10 },
  ];

  const signalScore = reviewerSignals.reduce((total, signal) => total + (signal.pattern.test(content) ? signal.points : 0), 0);

  return clampScore(10 + Math.min(32, completenessScore * 0.32) + signalScore);
};

const mockSuggestionForSection = (section: VolumeSection) => {
  const strength = analyzeSectionStrength(section);
  const evaluatorScore = scoreEvaluatorSection(section, strength.score);
  const missingSignalSuggestions = strength.missingSignals.map(
    (signal) => signalRiskFindings[signal] ?? `Reviewer cannot verify ${signal}; tie it to criteria, evidence, and metrics.`,
  );
  const suggestions = [...missingSignalSuggestions, ...sectionSuggestionFallbacks[section.key]].slice(0, 4);

  return {
    key: section.key,
    title: section.title,
    evaluatorScore,
    summary:
      evaluatorScore >= 75
        ? "Evaluator confidence is forming; the remaining gains come from sharper criteria mapping and verifiable evidence."
        : "Evaluator confidence is limited because the draft does not yet prove fit, feasibility, transition, or measurable impact.",
    suggestions,
  };
};

export const generateMockSectionSuggestions = async ({
  project,
  sectionKeys,
}: SectionSuggestionsInput): Promise<SectionSuggestionsResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  const selectedKeys = new Set(sectionKeys ?? project.sections.map((section) => section.key));

  return {
    generatedAt: new Date().toISOString(),
    sections: project.sections.filter((section) => selectedKeys.has(section.key)).map(mockSuggestionForSection),
  };
};
