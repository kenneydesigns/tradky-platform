import { ComplianceFinding, ComplianceStatus, Project, VolumeSectionKey } from "../types";
import { getSolicitationProfile } from "../data/solicitationProfiles";
import { getProjectRequiredSectionKeys, getProjectVisibleSections, isSectionVisible } from "./sectionVisibility";

export type ComplianceAnalysis = {
  overallStatus: ComplianceStatus;
  findings: ComplianceFinding[];
  counts: Record<ComplianceStatus, number>;
};

const STATUS_RANK: Record<ComplianceStatus, number> = {
  Pass: 0,
  Warning: 1,
  "High Risk": 2,
  "Non-Compliant": 3,
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const sectionContent = (project: Project, key: VolumeSectionKey) =>
  isSectionVisible(project, key) ? (project.sections.find((section) => section.key === key)?.content.trim() ?? "") : "";

const combinedProjectText = (project: Project) =>
  [
    project.solicitationText,
    project.proposalText,
    project.customSolicitationInstructions,
    ...getProjectVisibleSections(project).map((section) => `${section.title}\n${section.content}`),
  ]
    .join("\n\n")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text: string, terms: Array<string | RegExp>) =>
  terms.some((term) => (typeof term === "string" ? text.toLowerCase().includes(term.toLowerCase()) : term.test(text)));

const finding = (
  id: string,
  title: string,
  status: ComplianceStatus,
  detail: string,
  recommendation: string,
  relatedSections: VolumeSectionKey[],
): ComplianceFinding => ({
  id,
  title,
  status,
  detail,
  recommendation,
  relatedSections,
});

const statusFromBoolean = (passes: boolean, riskStatus: ComplianceStatus) => (passes ? "Pass" : riskStatus);

const profilePageLimit = (project: Project) => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  return project.submissionRequirements.pageLimit || profile.submissionRequirements.pageLimit;
};

const profileWordLimit = (project: Project) => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  return project.submissionRequirements.wordLimit || profile.submissionRequirements.wordLimit;
};

export const analyzeProposalCompliance = (project: Project): ComplianceAnalysis => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  const visibleSections = getProjectVisibleSections(project);
  const requiredSectionKeys = getProjectRequiredSectionKeys(project);
  const text = combinedProjectText(project);
  const wordCount = visibleSections.reduce((sum, section) => sum + countWords(section.content), 0);
  const pageLimit = profilePageLimit(project);
  const wordLimit = profileWordLimit(project) || pageLimit * 500;
  const missingRequiredSections = requiredSectionKeys
    .map((key) => project.sections.find((section) => section.key === key))
    .filter((section) => !section || countWords(section.content) < 35)
    .map((section) => section?.title ?? "Required section");
  const hasMetrics = hasAny(text, [
    /\b\d+(?:\.\d+)?%?\b/,
    "metric",
    "threshold",
    "baseline",
    "success criteria",
    "acceptance criteria",
    "kpi",
    "measurable",
  ]);
  const hasGovernmentCustomer = hasAny(text, [
    "dod",
    "government",
    "agency",
    "customer",
    "end user",
    "warfighter",
    "soldier",
    "sailor",
    "airman",
    "guardian",
    "program office",
    "mission owner",
    "nasa",
    "doe",
    "army",
    "navy",
    "air force",
  ]);
  const hasPhaseObjectives = hasAny(text, [
    /phase\s+i/i,
    /phase\s+ii/i,
    "objective",
    "aim",
    "milestone",
    "feasibility",
    "prototype",
  ]);
  const hasTransitionPath = hasAny(text, [
    "transition",
    "phase iii",
    "procurement",
    "acquisition",
    "program of record",
    "follow-on",
    "infusion",
    "fielding",
  ]);
  const hasCommercialization = hasAny(text, [
    "commercialization",
    "market",
    "revenue",
    "business model",
    "pricing",
    "sales",
    "go-to-market",
    "partner",
    "pilot",
  ]);
  const riskText = sectionContent(project, "risks") || text;
  const hasRiskAndMitigation = hasAny(riskText, ["risk", "dependency", "assumption"]) && hasAny(riskText, ["mitigation", "fallback", "contingency", "reduce"]);
  const hasInnovation = hasAny(text, ["novel", "innovative", "differentiated", "unique", "state of the art", "breakthrough", "ip", "patent"]);
  const hasEvidence = hasAny(text, [
    "data",
    "test",
    "validated",
    "demonstrated",
    "evidence",
    "pilot",
    "prototype",
    "benchmark",
    "citation",
    "letter of support",
    "loi",
  ]);
  const hasUnsupportedClaims =
    hasAny(text, ["best-in-class", "revolutionary", "game-changing", "proven", "guaranteed", "unmatched", "significant improvement"]) &&
    !hasEvidence;
  const limitRatio = wordLimit > 0 ? wordCount / wordLimit : 0;
  const limitStatus: ComplianceStatus =
    limitRatio > 1 ? "High Risk" : limitRatio > 0.9 ? "Warning" : wordCount < 250 ? "Warning" : "Pass";

  const findings = [
    finding(
      "required-sections",
      "Required proposal sections",
      missingRequiredSections.length ? "Non-Compliant" : "Pass",
      missingRequiredSections.length
        ? `Missing or materially underdeveloped: ${missingRequiredSections.join(", ")}.`
        : `All required ${profile.label} builder sections contain draft text.`,
      "Complete each required section with reviewer-facing substance before export.",
      requiredSectionKeys,
    ),
    finding(
      "success-metrics",
      "Measurable success metrics",
      statusFromBoolean(hasMetrics, "High Risk"),
      hasMetrics
        ? "The draft contains measurable thresholds, numbers, or success criteria."
        : "The draft does not give evaluators measurable pass/fail criteria.",
      "Add baseline, target, test method, threshold, and deliverable metrics.",
      ["technicalApproach", "workPlan", "evaluationMetricsSuccessCriteria"],
    ),
    finding(
      "government-customer",
      "Government customer or end user",
      statusFromBoolean(hasGovernmentCustomer, "High Risk"),
      hasGovernmentCustomer
        ? "A government, mission, agency, or end-user signal is present."
        : "The proposal does not clearly identify the government customer, user, or mission owner.",
      "Name the intended agency user, buyer, unit, program office, or mission owner, using placeholders if needed.",
      ["problemNeed", "commercializationTransition", "customerDiscoveryEndUserValidation"],
    ),
    finding(
      "phase-objectives",
      "Phase I / Phase II objectives",
      statusFromBoolean(hasPhaseObjectives, "High Risk"),
      hasPhaseObjectives
        ? "Phase, objective, feasibility, milestone, or prototype language is present."
        : "The draft does not clearly state the Phase I or Phase II objectives.",
      "State award-phase objectives, tasks, deliverables, and decision gates.",
      ["objectivesSpecificAims", "technicalApproach", "workPlan"],
    ),
    finding(
      "transition-path",
      "Transition path",
      statusFromBoolean(hasTransitionPath, "High Risk"),
      hasTransitionPath
        ? "Transition, acquisition, infusion, or follow-on language is present."
        : "The draft does not establish what happens after SBIR/STTR funding.",
      "Identify first adopter, adoption event, follow-on funder, procurement route, or Phase III path.",
      ["commercializationTransition"],
    ),
    finding(
      "commercialization-strategy",
      "Commercialization strategy",
      statusFromBoolean(hasCommercialization, "High Risk"),
      hasCommercialization
        ? "Market, revenue, business model, partner, or pilot language is present."
        : "The draft lacks a commercialization strategy evaluators can score.",
      "Add buyer segments, pricing or revenue logic, market entry, partners, pilots, and adoption assumptions.",
      ["commercializationTransition"],
    ),
    finding(
      "risks-mitigations",
      "Risks and mitigations",
      statusFromBoolean(hasRiskAndMitigation, "High Risk"),
      hasRiskAndMitigation
        ? "Risk and mitigation language is present."
        : "Risks are missing or not paired with mitigation, fallback, or residual-risk logic.",
      "List technical, schedule, security, regulatory, adoption, and cost risks with mitigation and fallback plans.",
      ["risks", "securityComplianceCyber", "workPlan"],
    ),
    finding(
      "innovation-claim",
      "Innovation claim",
      statusFromBoolean(hasInnovation, "Warning"),
      hasInnovation
        ? "The draft includes an innovation, novelty, differentiation, or IP signal."
        : "The proposal does not yet make a defensible innovation claim.",
      "Compare the solution with incumbent alternatives and state what is technically differentiated.",
      ["innovation", "technicalApproach"],
    ),
    finding(
      "unsupported-claims",
      "Unsupported technical claims",
      hasUnsupportedClaims ? "Warning" : "Pass",
      hasUnsupportedClaims
        ? "Promotional technical claims appear without nearby evidence, data, test, or validation language."
        : "No obvious unsupported superlative technical claims were detected by the heuristic checker.",
      "Replace broad claims with evidence, assumptions, source data, tests, or bracketed placeholders.",
      ["technicalApproach", "innovation"],
    ),
    finding(
      "page-word-count",
      "Page / word count",
      limitStatus,
      limitStatus === "Pass"
        ? `Builder draft is ${wordCount} words against an estimated ${wordLimit}-word limit.`
        : wordCount < 250
          ? "The builder draft is very short for a technical volume and may be underdeveloped."
          : `Builder draft is ${wordCount} words against an estimated ${wordLimit}-word limit.`,
      "Use the solicitation page limit as the source of truth; this app estimates words at roughly 500 words per page.",
      requiredSectionKeys,
    ),
  ];
  const counts = findings.reduce(
    (map, item) => ({
      ...map,
      [item.status]: map[item.status] + 1,
    }),
    { Pass: 0, Warning: 0, "High Risk": 0, "Non-Compliant": 0 } as Record<ComplianceStatus, number>,
  );
  const overallStatus = findings.reduce(
    (current, item) => (STATUS_RANK[item.status] > STATUS_RANK[current] ? item.status : current),
    "Pass" as ComplianceStatus,
  );

  return {
    overallStatus,
    findings,
    counts,
  };
};
