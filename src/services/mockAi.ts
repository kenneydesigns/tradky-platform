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
  ImplementSectionSuggestionsInput,
  ImplementSectionSuggestionsResult,
  Project,
  SectionSuggestionsInput,
  SectionSuggestionsResult,
  VolumeSection,
  VolumeSectionKey,
} from "../types";
import { getSolicitationProfile } from "../data/solicitationProfiles";
import { getSectionPurpose } from "../data/sectionPurposes";
import { getProjectVisibleSections } from "../utils/sectionVisibility";
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
  const profile = getSolicitationProfile(project.solicitationProfile);
  const problemSource = sourceSentence(
    [project.customSolicitationInstructions, project.solicitationText].filter(Boolean).join(" "),
    `${profile.label} ${project.phase} topic ${project.topicId || project.solicitationNumber || "opportunity"}`,
  );
  const proposalSource = sourceSentence(project.proposalText, "the current concept notes and technical direction");
  const existingSectionContext = sourceSentence(
    project.sections
      .filter((section) => section.content.trim())
      .map((section) => `${section.title}: ${section.content}`)
      .join(" "),
    "the current section drafts",
  );
  const transitionSource =
    project.evaluation?.transitionPotential.join(" ") ||
    profile.transitionEmphasis;
  const technicalActions =
    project.evaluation?.technicalMerit.join(" ") ||
    "the technical hypothesis, baseline performance, validation method, and measurable success criteria";
  const rewriteActions =
    project.evaluation?.rewriteActions.join(" ") ||
    profile.complianceChecks.join(" ");

  return {
    problemNeed: [
      `The proposed ${project.phase} effort addresses a ${profile.label} need reflected in ${problemSource}.`,
      `Based on the current proposal context, ${existingSectionContext}, the problem statement should make the affected end user, operational or public-benefit consequence, and current performance shortfall visible before the solution is introduced.`,
      `To support evaluator scoring, this section should quantify the gap with baseline conditions, target improvement, urgency, and the reason this effort fits the selected solicitation profile.`,
    ].join("\n\n"),
    objectivesSpecificAims: [
      `The ${project.phase} objectives should translate ${problemSource} into a small set of testable aims.`,
      `Each aim should state what will be validated, why it matters for ${profile.label}, what evidence will be produced, and how success will be judged.`,
      `A strong version uses measurable language rather than broad intent: aim, method, expected result, and decision criterion.`,
    ].join("\n\n"),
    technicalApproach: [
      `The technical approach turns ${proposalSource} into a testable development path that fits ${profile.label}.`,
      `The work should define the system architecture, key technical assumptions, and validation method, then tie those choices to measurable thresholds rather than general feasibility language.`,
      `Evaluator confidence will improve if the section makes ${technicalActions} explicit and connects each claim to the evidence the team will collect during ${project.phase}.`,
    ].join("\n\n"),
    innovation: [
      `The innovation is the combination of method, implementation, and profile fit that improves on incumbent alternatives for this ${project.agency} use case.`,
      `Rather than presenting novelty as a general claim, this section should compare the proposed approach against current products, research baselines, internal workarounds, and the constraints in the pasted solicitation instructions.`,
      `The strongest version will explain what is technically differentiated, why it is defensible, and what evidence would prove that differentiation during the award period.`,
    ].join("\n\n"),
    workPlan: [
      `The ${project.phase} work plan should be organized around tasks that retire the highest feasibility risks first.`,
      `Task 1 should refine requirements and success criteria; Task 2 should build or integrate the prototype elements; Task 3 should run validation experiments and analyze results; Task 4 should prepare the transition and Phase II evidence package.`,
      `Each task needs objectives, deliverables, responsible contributors, timing, and go/no-go criteria tied to ${rewriteActions}.`,
    ].join("\n\n"),
    expectedOutcomesDeliverables: [
      `The expected outcomes should identify what reviewers will receive or observe at the end of ${project.phase}.`,
      `Describe concrete deliverables such as prototypes, data packages, reports, demonstrations, models, software, or validation artifacts, then connect each one to a decision the evaluator or customer can make.`,
      `The strongest deliverables include acceptance criteria and explain how they support the next funding, research, or adoption decision.`,
    ].join("\n\n"),
    evaluationMetricsSuccessCriteria: [
      `Evaluation metrics should define how ${project.name} will prove feasibility and value.`,
      `For each core objective, state the baseline, target threshold, test method, data source, and pass/fail criterion that will be used during ${project.phase}.`,
      `Metrics should be realistic for the award period while still strong enough to support ${profile.evaluationEmphasis.join(", ")}.`,
    ].join("\n\n"),
    relatedWorkPriorRd: [
      `Related work and prior R&D should show that the team understands the technical baseline and is not starting from unsupported claims.`,
      `Summarize relevant prior prototypes, data, studies, publications, customer pilots, or internal R&D, then state what gap remains for this effort to close.`,
      `The section should make novelty and feasibility easier to score by comparing the proposed work with current alternatives and known limitations.`,
    ].join("\n\n"),
    team: [
      `The team section should map each contributor to the work they directly own, including technical execution, customer discovery, commercialization, and transition planning.`,
      `For ${project.name}, reviewers should see who is accountable for architecture, experimentation, program management, security or regulatory constraints, and buyer engagement.`,
      `Any gaps should be addressed through advisors, subcontractors, hiring milestones, or partner commitments instead of left implicit.`,
    ].join("\n\n"),
    facilitiesEquipmentResources: [
      `Facilities, equipment, and resources should show that the team can execute the proposed work without hidden dependencies.`,
      `Identify the labs, equipment, software, datasets, compute resources, testing environments, manufacturing access, or clinical/regulatory resources needed for each major task.`,
      `For reviewer confidence, connect each resource to the work plan and explain whether it is already available, partner-provided, or still to be secured.`,
    ].join("\n\n"),
    commercializationTransition: [
      `Commercialization and transition should describe the path from prototype evidence to adoption, not just a market opportunity.`,
      `For this ${profile.label} project, the draft should identify target users, first use cases, buyer type, procurement or market trigger, and the ${project.agency} stakeholder most likely to sponsor follow-on activity.`,
      `Use the evaluation guidance as source material: ${transitionSource}.`,
    ].join("\n\n"),
    customerDiscoveryEndUserValidation: [
      `Customer discovery should document what the team has learned from end users, buyers, partners, or mission owners.`,
      `Summarize interviews, letters, pilots, memoranda, feedback themes, workflow observations, or validation evidence, using bracketed placeholders where specific names or dates are still needed.`,
      `The section should connect that evidence to the problem statement, product requirements, first use case, and commercialization or transition plan.`,
    ].join("\n\n"),
    phaseIToPhaseIITransition: [
      `The Phase I to Phase II transition plan should explain how this effort converts feasibility evidence into a larger prototype or validation program.`,
      `State the evidence package needed for the next phase, the technical maturity target, the expected Phase II scope, and the customer, agency, investor, or partner milestones that would support continuation.`,
      `A strong plan makes the next decision obvious: what must be true, who cares, and what funding or adoption path follows.`,
    ].join("\n\n"),
    risks: [
      `The risk section should make the proposal feel controlled and executable.`,
      `List the highest technical, schedule, budget, regulatory, security, and adoption risks, then pair each with likelihood, impact, mitigation, fallback plan, and evidence the team will collect.`,
      `The strongest risks are specific to ${project.name} and tied to task-level decision points, not generic project management language.`,
    ].join("\n\n"),
    securityComplianceCyber: [
      `Security, compliance, and cyber content should identify constraints that could affect execution, approval, deployment, or data handling.`,
      `Address applicable standards or review paths such as CMMC, NIST controls, ITAR/export, HIPAA, human subjects, privacy, safety, cybersecurity testing, or agency-specific authorization requirements where relevant.`,
      `For each applicable constraint, state the mitigation plan, responsible owner, and evidence needed to show the proposal can proceed compliantly.`,
    ].join("\n\n"),
    dataRightsIpStrategy: [
      `The data rights and IP strategy should explain what the company owns, what background IP is being used, and how the proposed work will protect defensible advantage.`,
      `Address patents, trade secrets, licenses, government purpose rights, deliverable data, third-party dependencies, and freedom-to-operate assumptions where relevant.`,
      `The section should make commercialization and government adoption easier to evaluate by reducing ambiguity around ownership and rights.`,
    ].join("\n\n"),
    budgetNarrative: [
      `The budget narrative should explain why each cost is necessary to complete the technical work plan.`,
      `Labor should be connected to task ownership, materials and software to prototype or test needs, travel to customer or transition activities, and subcontractors to specialized capabilities the core team does not provide.`,
      `Close the section by tying cost realism to expected deliverables and the evidence package needed for the next funding or adoption decision.`,
    ].join("\n\n"),
    referencesCitations: [
      `References and citations should give reviewers a concise evidence trail for technical, scientific, regulatory, market, and prior-art claims.`,
      `List sources that support the baseline, state of the art, standards, market facts, clinical or scientific evidence, and any cited performance claims.`,
      `Use a consistent citation format and add bracketed placeholders where a source must still be verified before submission.`,
    ].join("\n\n"),
  };
};

export const generateMockDraftSections = async (input: DraftSectionsInput): Promise<DraftSectionsResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 700));

  const drafts = sectionDrafts(input);
  const selectedKeys = new Set(input.sectionKeys ?? getProjectVisibleSections(input.project).map((section) => section.key));

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
  objectivesSpecificAims: [
    "Objectives are not yet testable enough for reviewers to judge feasibility.",
    "Specific aims need a clear method, expected result, and success threshold.",
    "Aims should map directly to the solicitation criteria and phase scope.",
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
  expectedOutcomesDeliverables: [
    "Deliverables are score-limited unless reviewers can see concrete outputs.",
    "Expected outcomes should be paired with acceptance criteria and decision value.",
    "The section should explain how each deliverable supports the next award, adoption, or research decision.",
  ],
  evaluationMetricsSuccessCriteria: [
    "Metrics are weak unless baseline, target, threshold, and test method are explicit.",
    "Success criteria should be concrete enough to support pass/fail evaluator judgment.",
    "Measurement methods need to tie back to the technical objectives and deliverables.",
  ],
  relatedWorkPriorRd: [
    "Prior R&D is underdeveloped unless it explains what has already been proven.",
    "Related work should compare the proposed approach against current alternatives and limitations.",
    "Preliminary evidence should be connected to feasibility and novelty claims.",
  ],
  team: [
    "Team Qualifications score is limited unless relevant experience, expertise, facilities, and equipment are tied to the work.",
    "Does not demonstrate the team's ability to perform R&D and execute the proposed approach.",
    "Uncovered capabilities need an advisor, partner, subcontractor, facility, or hiring plan instead of an implicit gap.",
  ],
  facilitiesEquipmentResources: [
    "Facilities and equipment are weak unless resources are tied to specific work-plan tasks.",
    "Reviewer confidence is limited if access to critical labs, datasets, testbeds, or tools is unclear.",
    "Resource gaps should be addressed through partners, subcontractors, or acquisition milestones.",
  ],
  commercializationTransition: [
    "Fails to demonstrate Commercialization through market/revenue potential, business plan, and defense/private interest.",
    "Defense customer interest is score-limited unless the customer, available funds, investor funding, or non-government revenue are clear.",
    "Transition strategy needs enough specificity to support the Phase II CM/supporting-document criteria when applicable.",
  ],
  customerDiscoveryEndUserValidation: [
    "Customer discovery is weak unless interviews, feedback, letters, pilots, or mission-owner evidence are visible.",
    "End-user validation should explain how the use case and requirements were confirmed.",
    "Reviewer confidence improves when customer evidence connects to transition or commercialization strategy.",
  ],
  phaseIToPhaseIITransition: [
    "The next-phase plan is vague unless Phase I evidence is tied to Phase II scope.",
    "Transition readiness should identify milestones, decision gates, and follow-on stakeholders.",
    "The proposal should explain what must be proven before the next funding or adoption decision.",
  ],
  risks: [
    "Level of Risk score is limited unless major risks are identified and mitigated.",
    "Residual risks should be framed as acceptable for an SBIR/STTR R&D effort, or explicitly reduced by mitigation evidence.",
    "Risk mitigation should tie to work plan tasks, tests, and decision gates.",
  ],
  securityComplianceCyber: [
    "Compliance risk is weak unless applicable standards, approvals, and owners are named.",
    "Security or cyber constraints should be tied to the product, data, deployment, or testing environment.",
    "Human subjects, privacy, export, or agency authorization issues need a plan where applicable.",
  ],
  dataRightsIpStrategy: [
    "IP strategy is limited unless ownership, protection, and defensibility are explicit.",
    "Data rights should clarify deliverables, government rights, licenses, and third-party dependencies.",
    "Reviewer confidence improves when rights strategy supports both adoption and commercialization.",
  ],
  budgetNarrative: [
    "Cost Volume logic is weak unless materials/equipment are appropriate for the proposed technical effort.",
    "Personnel, labor skill mix, and hours need to map to the proposed technical effort.",
    "Travel, specialized efforts, subcontractors, and consultants need clear relevance or should be marked not applicable.",
  ],
  referencesCitations: [
    "References are weak unless they support technical, scientific, market, or regulatory claims.",
    "Citations should be specific enough for reviewers to verify key assumptions.",
    "Placeholder citations should be resolved before submission.",
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

const exampleImprovedLanguage: Record<VolumeSectionKey, string> = {
  problemNeed:
    "The target [agency/end user] currently experiences [measurable gap], creating [mission or public-benefit consequence]; success for this effort is defined as [target threshold] in [operational context].",
  objectivesSpecificAims:
    "Aim [number] will validate [technical hypothesis] by [method], with success defined as [metric/threshold] and the resulting evidence used to decide [next step].",
  technicalApproach:
    "During Phase I, we will validate [technical hypothesis] by building [prototype/test article] and measuring [metric] against a baseline of [baseline] with success defined as [threshold].",
  innovation:
    "Unlike [incumbent approach], the proposed method [specific differentiation], which matters because it enables [measurable advantage] under [agency/use-case constraint].",
  workPlan:
    "Task [number] will produce [deliverable] by [date/month], with go/no-go success defined as [metric/threshold] and owned by [role].",
  expectedOutcomesDeliverables:
    "By the end of [phase], the team will deliver [artifact], accepted when [metric/threshold] demonstrates [decision-useful outcome].",
  evaluationMetricsSuccessCriteria:
    "Success will be measured against a baseline of [baseline] using [test method], with a target of [threshold] required to proceed to [next decision].",
  relatedWorkPriorRd:
    "Prior work demonstrated [result/evidence], but [gap] remains; this effort advances the state of the art by [specific technical step].",
  team:
    "[Named role] will lead [technical task] based on [relevant experience], while [partner/advisor] covers [gap] needed to execute [work-plan element].",
  facilitiesEquipmentResources:
    "[Facility/equipment/resource] is available through [owner/partner] and will be used for [task/test], enabling [specific evidence or deliverable].",
  commercializationTransition:
    "The first transition target is [customer/user], who would adopt the result through [procurement/infusion/market path] after [evidence milestone] demonstrates [value metric].",
  customerDiscoveryEndUserValidation:
    "[Number] interviews with [customer/end-user segment] validated [pain point/use case], leading to [requirement] and support for [pilot/adoption step].",
  phaseIToPhaseIITransition:
    "Phase I will produce [evidence package]; Phase II will use that evidence to build [prototype/scale-up] for [customer/market] by [milestone].",
  risks:
    "If [risk] occurs, the team will mitigate it by [action], fall back to [alternative], and use [test/metric] to determine whether residual risk is acceptable.",
  securityComplianceCyber:
    "[Compliance/security requirement] applies because [reason]; [owner] will address it through [control/protocol/review] before [deployment/test milestone].",
  dataRightsIpStrategy:
    "The company will protect [background/foreground IP] through [patent/trade secret/license] while delivering [data/software] under [rights approach].",
  budgetNarrative:
    "The requested [cost category] supports Task [number] by enabling [technical activity/deliverable], making the cost necessary for [validation or transition evidence].",
  referencesCitations:
    "[Citation/source] supports the claim that [baseline/state of art/standard], which justifies [technical choice or performance target].",
};

const mockSuggestionForSection = (section: VolumeSection, project: Project) => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  const strength = analyzeSectionStrength(section);
  const evaluatorScore = scoreEvaluatorSection(section, strength.score);
  const missingSignalSuggestions = strength.missingSignals.map(
    (signal) => signalRiskFindings[signal] ?? `Reviewer cannot verify ${signal}; tie it to criteria, evidence, and metrics.`,
  );
  const suggestions = [...missingSignalSuggestions, ...sectionSuggestionFallbacks[section.key]].slice(0, 4);
  const leadFinding = suggestions[0] ?? "Reviewer cannot yet verify solicitation fit, technical merit, or transition value.";
  const lowestSignal = strength.missingSignals[0] ?? "the highest-value scoring evidence";

  return {
    key: section.key,
    title: section.title,
    evaluatorScore,
    summary:
      evaluatorScore >= 75
        ? "Evaluator confidence is forming; the remaining gains come from sharper criteria mapping and verifiable evidence."
        : "Evaluator confidence is limited because the draft does not yet prove fit, feasibility, transition, or measurable impact.",
    suggestions,
    reviewerFinding: leadFinding,
    whyItMatters: `For ${profile.label}, this matters because evaluators must see how the section supports the required criteria and compliance checks without inferring missing facts.`,
    scoreImpact:
      evaluatorScore >= 75
        ? "Likely modest score lift if the recommendation is addressed with specific evidence."
        : "Likely caps the section score until the missing evidence is added.",
    rewriteRecommendation: `Rewrite the section around ${lowestSignal}, then connect the claim to a measurable outcome, supporting evidence, and the selected solicitation profile.`,
    improvedLanguageExample: exampleImprovedLanguage[section.key],
  };
};

export const generateMockSectionSuggestions = async ({
  project,
  sectionKeys,
}: SectionSuggestionsInput): Promise<SectionSuggestionsResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  const selectedKeys = new Set(sectionKeys ?? getProjectVisibleSections(project).map((section) => section.key));

  return {
    generatedAt: new Date().toISOString(),
    sections: project.sections.filter((section) => selectedKeys.has(section.key)).map((section) => mockSuggestionForSection(section, project)),
  };
};

const cleanSelectedSuggestions = (selectedSuggestions: string[]) =>
  [...new Set(selectedSuggestions.map((suggestion) => suggestion.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 8);

const rewriteFindingAsSectionProse = (suggestion: string, section: VolumeSection, project: Project) => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  const sectionPurpose = getSectionPurpose(section.key).replace(/\.$/, "").toLowerCase();
  const normalizedSuggestion = suggestion
    .replace(/^(does not clearly|does not|fails to|lacks|needs?|should)\s+/i, "")
    .replace(/\.$/, "");
  const evidencePlaceholder =
    section.key === "evaluationMetricsSuccessCriteria"
      ? "[baseline, target threshold, test method, and pass/fail criterion]"
      : section.key === "commercializationTransition"
        ? "[target customer, adoption trigger, revenue or transition evidence, and follow-on milestone]"
        : section.key === "risks"
          ? "[risk, likelihood, impact, mitigation, fallback, and residual-risk rationale]"
          : "[specific proposal evidence, metric, customer/use case, or validation artifact]";

  return [
    `The section addresses ${normalizedSuggestion} by tying the claim to ${evidencePlaceholder}.`,
    `For ${profile.label}, this evidence should be presented as reviewer-verifiable support for ${sectionPurpose}`,
    "and should cite the current proposal context rather than adding unsupported facts.",
  ].join(" ");
};

export const generateMockImplementedSectionSuggestions = async ({
  project,
  sectionKey,
  selectedSuggestions,
}: ImplementSectionSuggestionsInput): Promise<ImplementSectionSuggestionsResult> => {
  await new Promise((resolve) => window.setTimeout(resolve, 700));

  const section = project.sections.find((item) => item.key === sectionKey);
  if (!section) {
    throw new Error("Selected section was not found.");
  }

  const cleanSuggestions = cleanSelectedSuggestions(selectedSuggestions);
  if (!cleanSuggestions.length) {
    throw new Error("Select at least one evaluator suggestion to implement.");
  }

  const profile = getSolicitationProfile(project.solicitationProfile);
  const originalText = section.content.trim();
  const proposalAnchor = sourceSentence(
    [project.proposalText, project.solicitationText, project.customSolicitationInstructions].filter(Boolean).join(" "),
    `${profile.label} ${project.phase} context for ${project.name}`,
  );
  const opening = originalText.length
    ? originalText
    : `${section.title} should explain ${getSectionPurpose(section.key).toLowerCase()} The current proposal context starts from ${proposalAnchor}.`;
  const implementedParagraphs = cleanSuggestions.map((suggestion) => rewriteFindingAsSectionProse(suggestion, section, project));

  return {
    generatedAt: new Date().toISOString(),
    selectedSuggestions: cleanSuggestions,
    section: {
      ...section,
      content: [opening, ...implementedParagraphs].join("\n\n"),
    },
  };
};
