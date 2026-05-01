import {
  EvaluationWeights,
  SolicitationProfileConfig,
  SolicitationProfileKey,
  SubmissionRequirements,
  VolumeSectionKey,
  VolumeSectionStatus,
  VolumeSectionStatusMap,
} from "../types";
import { VOLUME_SECTION_KEYS } from "./volumeSections";

const allSections: VolumeSectionKey[] = VOLUME_SECTION_KEYS;

export const DEFAULT_EVALUATION_WEIGHTS: EvaluationWeights = {
  solicitationFit: 13,
  technicalMerit: 18,
  feasibility: 13,
  innovation: 11,
  evidenceSupport: 11,
  metrics: 10,
  transitionPotential: 12,
  riskAwareness: 6,
  clarity: 6,
};

const defaultRequirements: SubmissionRequirements = {
  pageLimit: 15,
  wordLimit: 7500,
  attachments: [],
  notes: ["Confirm page limits, font, margins, file naming, registrations, and required forms against the live solicitation."],
};

const unique = <Value>(items: Value[]) => [...new Set(items)];

const remainingSections = (requiredSections: VolumeSectionKey[], optionalSections: VolumeSectionKey[]) => {
  const visibleSections = new Set([...requiredSections, ...optionalSections]);
  return allSections.filter((key) => !visibleSections.has(key));
};

const profile = (
  config: Omit<
    SolicitationProfileConfig,
    "hiddenSections" | "requiredComplianceChecks" | "submissionRequirements"
  > & {
    hiddenSections?: VolumeSectionKey[];
    submissionRequirements?: Partial<SubmissionRequirements>;
  },
): SolicitationProfileConfig => {
  const requiredSections = unique(config.requiredSections);
  const optionalSections = unique(config.optionalSections).filter((key) => !requiredSections.includes(key));
  const hiddenSections = config.hiddenSections
    ? unique(config.hiddenSections).filter((key) => !requiredSections.includes(key) && !optionalSections.includes(key))
    : remainingSections(requiredSections, optionalSections);

  return {
    ...config,
    requiredSections,
    optionalSections,
    hiddenSections,
    requiredComplianceChecks: config.complianceChecks,
    submissionRequirements: {
      ...defaultRequirements,
      ...config.submissionRequirements,
      attachments: config.submissionRequirements?.attachments ?? defaultRequirements.attachments,
      notes: config.submissionRequirements?.notes ?? defaultRequirements.notes,
    },
  };
};

export const SOLICITATION_PROFILES: SolicitationProfileConfig[] = [
  profile({
    key: "afwerxOpenTopic",
    label: "DAF / AFWERX",
    agency: "DAF / AFWERX",
    program: "SBIR/STTR",
    requiredSections: [
      "problemNeed",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "commercializationTransition",
      "customerDiscoveryEndUserValidation",
      "risks",
    ],
    optionalSections: [
      "objectivesSpecificAims",
      "team",
      "facilitiesEquipmentResources",
      "phaseIToPhaseIITransition",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    evaluationWeights: {
      solicitationFit: 12,
      technicalMerit: 17,
      feasibility: 12,
      innovation: 10,
      evidenceSupport: 10,
      metrics: 10,
      transitionPotential: 17,
      riskAwareness: 6,
      clarity: 6,
    },
    evaluationEmphasis: [
      "Problem/need and mission owner clarity",
      "Technical approach tied to measurable feasibility evidence",
      "Innovation against current alternatives",
      "Transition customer, validation evidence, and dual-use commercialization",
      "Metrics, deliverables, and acceptable risk for SBIR/STTR R&D",
    ],
    complianceChecks: [
      "Defense need and operational end user are explicit.",
      "Dual-use commercialization and transition path are credible.",
      "Customer, funding, or adoption evidence is identified.",
      "Success metrics and deliverables are measurable.",
      "Technical risk is acceptable for SBIR/STTR R&D.",
    ],
    suggestedTone: "Direct, mission-first, and reviewer-facing. Start with operational impact before technical depth.",
    transitionEmphasis: "Very high. Name the DAF customer, first use case, follow-on funder, and Phase III path wherever possible.",
    submissionRequirements: {
      attachments: ["Customer Memorandum if applicable", "Cost volume", "Company commercialization materials if requested"],
    },
  }),
  profile({
    key: "armySbirSttr",
    label: "Army SBIR/STTR",
    agency: "Army",
    program: "SBIR/STTR",
    requiredSections: [
      "problemNeed",
      "objectivesSpecificAims",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "team",
      "commercializationTransition",
      "customerDiscoveryEndUserValidation",
      "risks",
    ],
    optionalSections: [
      "facilitiesEquipmentResources",
      "phaseIToPhaseIITransition",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["relatedWorkPriorRd"],
    evaluationWeights: {
      solicitationFit: 16,
      technicalMerit: 18,
      feasibility: 14,
      innovation: 11,
      evidenceSupport: 10,
      metrics: 10,
      transitionPotential: 11,
      riskAwareness: 5,
      clarity: 5,
    },
    evaluationEmphasis: [
      "Army modernization or operational fit",
      "Measurable technical objectives and deliverables",
      "Feasible Phase I/Phase II execution plan",
      "Transition path to Army user, lab, PEO, or program",
    ],
    complianceChecks: [
      "Army modernization or operational need is explicit.",
      "Technical objectives and deliverables are measurable.",
      "Phase I feasibility or Phase II prototype scope is clear.",
      "Transition path to Army user, lab, PEO, or program is credible.",
    ],
    suggestedTone: "Operational, concrete, and modernization-oriented. Tie benefits to soldier, formation, or acquisition outcomes.",
    transitionEmphasis: "High. Connect the work to Army user evaluation, PEO/lab pathway, and realistic follow-on procurement or integration.",
  }),
  profile({
    key: "navySbirSttr",
    label: "Navy SBIR/STTR",
    agency: "Navy",
    program: "SBIR/STTR",
    requiredSections: [
      "problemNeed",
      "objectivesSpecificAims",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "team",
      "commercializationTransition",
      "customerDiscoveryEndUserValidation",
      "risks",
    ],
    optionalSections: [
      "facilitiesEquipmentResources",
      "phaseIToPhaseIITransition",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["relatedWorkPriorRd"],
    evaluationWeights: {
      solicitationFit: 16,
      technicalMerit: 18,
      feasibility: 14,
      innovation: 11,
      evidenceSupport: 11,
      metrics: 10,
      transitionPotential: 10,
      riskAwareness: 5,
      clarity: 5,
    },
    evaluationEmphasis: [
      "Navy or Marine Corps use case specificity",
      "Technical discipline and integration realism",
      "Fleet/platform/system constraints",
      "Transition sponsor or acquisition pathway",
    ],
    complianceChecks: [
      "Navy or Marine Corps use case is explicit.",
      "Fleet, platform, command, or system integration constraints are addressed.",
      "Measurable objectives and deliverables are present.",
      "Transition sponsor or acquisition pathway is identified.",
    ],
    suggestedTone: "Fleet-relevant and technically disciplined. Explain operational value without hiding integration risk.",
    transitionEmphasis: "High. Tie the result to a Navy customer, transition sponsor, fleet experiment, or program pathway.",
  }),
  profile({
    key: "darpaBaa",
    label: "DARPA BAA",
    agency: "DARPA",
    program: "BAA",
    requiredSections: [
      "problemNeed",
      "objectivesSpecificAims",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "team",
      "risks",
    ],
    optionalSections: [
      "relatedWorkPriorRd",
      "facilitiesEquipmentResources",
      "commercializationTransition",
      "phaseIToPhaseIITransition",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["customerDiscoveryEndUserValidation"],
    evaluationWeights: {
      solicitationFit: 14,
      technicalMerit: 22,
      feasibility: 12,
      innovation: 18,
      evidenceSupport: 10,
      metrics: 8,
      transitionPotential: 6,
      riskAwareness: 6,
      clarity: 4,
    },
    evaluationEmphasis: [
      "Technical novelty beyond incremental improvement",
      "Feasibility evidence for an ambitious technical leap",
      "Milestones, go/no-go points, and risk reduction",
      "Performer capability and credible execution resources",
    ],
    complianceChecks: [
      "Technical vision is ambitious and directly responsive to the BAA.",
      "Innovation is more than incremental improvement.",
      "Approach contains measurable milestones and decision points.",
      "Key technical risks and alternatives are explicit.",
      "Performer capability and facilities are sufficient for the proposed leap.",
    ],
    suggestedTone: "Bold but evidence-controlled. Make the leap clear, then show how risk will be retired.",
    transitionEmphasis: "Moderate. DARPA evaluators still need a plausible path to operational or program relevance after proof of concept.",
    submissionRequirements: {
      pageLimit: 20,
      wordLimit: 10000,
      attachments: ["BAA-specific abstract or quad chart if requested", "Cost proposal", "Administrative forms"],
    },
  }),
  profile({
    key: "doeSbirSttr",
    label: "DOE SBIR/STTR",
    agency: "DOE",
    program: "SBIR/STTR",
    requiredSections: [
      "objectivesSpecificAims",
      "technicalApproach",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "relatedWorkPriorRd",
      "facilitiesEquipmentResources",
      "commercializationTransition",
    ],
    optionalSections: [
      "problemNeed",
      "innovation",
      "team",
      "risks",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["customerDiscoveryEndUserValidation", "phaseIToPhaseIITransition"],
    evaluationWeights: {
      solicitationFit: 15,
      technicalMerit: 20,
      feasibility: 14,
      innovation: 12,
      evidenceSupport: 12,
      metrics: 10,
      transitionPotential: 7,
      riskAwareness: 5,
      clarity: 5,
    },
    evaluationEmphasis: [
      "Technical objectives and research plan",
      "Prior R&D and evidence base",
      "Facilities, equipment, and resources",
      "Commercial application and public benefit",
    ],
    complianceChecks: [
      "DOE subtopic fit and public-benefit relevance are explicit.",
      "Scientific or technical merit is supported by evidence.",
      "Research objectives, methods, and success criteria are measurable.",
      "Related R&D and facilities/resources are described.",
      "Commercial application and market opportunity are described.",
    ],
    suggestedTone: "Scientific, evidence-led, and commercially aware. Anchor claims in the DOE subtopic and validation plan.",
    transitionEmphasis: "Moderate. Commercialization should be credible, but scientific merit and public benefit carry heavy weight.",
  }),
  profile({
    key: "nasaSbirSttr",
    label: "NASA SBIR/STTR",
    agency: "NASA",
    program: "SBIR/STTR",
    requiredSections: [
      "problemNeed",
      "objectivesSpecificAims",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "team",
      "commercializationTransition",
      "phaseIToPhaseIITransition",
    ],
    optionalSections: [
      "relatedWorkPriorRd",
      "facilitiesEquipmentResources",
      "customerDiscoveryEndUserValidation",
      "risks",
      "securityComplianceCyber",
      "dataRightsIpStrategy",
      "budgetNarrative",
      "referencesCitations",
    ],
    evaluationWeights: {
      solicitationFit: 16,
      technicalMerit: 19,
      feasibility: 14,
      innovation: 12,
      evidenceSupport: 11,
      metrics: 10,
      transitionPotential: 8,
      riskAwareness: 5,
      clarity: 5,
    },
    evaluationEmphasis: [
      "NASA mission directorate or subtopic relevance",
      "Technical merit, innovation, and feasibility",
      "NASA infusion plus non-NASA commercialization path",
      "Phase I/Phase II deliverables and transition readiness",
    ],
    complianceChecks: [
      "NASA mission directorate, subtopic, or program relevance is explicit.",
      "Innovation and technical merit are clearly differentiated.",
      "Phase I or Phase II objectives and deliverables are measurable.",
      "Commercial and NASA infusion paths are both addressed.",
    ],
    suggestedTone: "Mission-aligned, technically clear, and infusion-oriented. Tie the work to NASA use cases and broader markets.",
    transitionEmphasis: "Moderate to high. Show NASA infusion potential plus a realistic non-NASA commercialization path.",
  }),
  profile({
    key: "nihSbirSttr",
    label: "NIH SBIR/STTR",
    agency: "NIH",
    program: "SBIR/STTR",
    requiredSections: [
      "objectivesSpecificAims",
      "problemNeed",
      "innovation",
      "technicalApproach",
      "workPlan",
      "team",
      "facilitiesEquipmentResources",
      "commercializationTransition",
    ],
    optionalSections: [
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "relatedWorkPriorRd",
      "risks",
      "securityComplianceCyber",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["customerDiscoveryEndUserValidation", "phaseIToPhaseIITransition", "dataRightsIpStrategy"],
    evaluationWeights: {
      solicitationFit: 12,
      technicalMerit: 20,
      feasibility: 15,
      innovation: 13,
      evidenceSupport: 14,
      metrics: 8,
      transitionPotential: 8,
      riskAwareness: 4,
      clarity: 6,
    },
    evaluationEmphasis: [
      "Specific aims and research strategy",
      "Significance, innovation, and approach",
      "Human subjects or clinical compliance when applicable",
      "Facilities, biosketch/team capability, and commercialization",
    ],
    complianceChecks: [
      "Specific aims are clear and testable.",
      "Research strategy covers significance, innovation, and approach.",
      "Human subjects, animal subjects, clinical, biosecurity, or data compliance is addressed when applicable.",
      "Facilities/resources and team capability are described.",
      "Commercialization path is credible for an SBIR/STTR application.",
    ],
    suggestedTone: "Scientific, hypothesis-driven, and reviewer-clear. Make significance and approach easy to score.",
    transitionEmphasis: "Moderate. Commercialization matters, but reviewer confidence starts with aims, evidence, feasibility, and investigator capability.",
  }),
  profile({
    key: "nsfSbirSttr",
    label: "NSF SBIR/STTR",
    agency: "NSF",
    program: "SBIR/STTR",
    requiredSections: [
      "problemNeed",
      "objectivesSpecificAims",
      "technicalApproach",
      "innovation",
      "workPlan",
      "expectedOutcomesDeliverables",
      "evaluationMetricsSuccessCriteria",
      "team",
      "commercializationTransition",
      "customerDiscoveryEndUserValidation",
    ],
    optionalSections: [
      "relatedWorkPriorRd",
      "facilitiesEquipmentResources",
      "risks",
      "budgetNarrative",
      "referencesCitations",
    ],
    hiddenSections: ["phaseIToPhaseIITransition", "securityComplianceCyber", "dataRightsIpStrategy"],
    evaluationWeights: {
      solicitationFit: 13,
      technicalMerit: 19,
      feasibility: 14,
      innovation: 14,
      evidenceSupport: 12,
      metrics: 9,
      transitionPotential: 10,
      riskAwareness: 4,
      clarity: 5,
    },
    evaluationEmphasis: [
      "Technical innovation and feasibility",
      "Intellectual merit and broader impact",
      "Customer discovery and market validation",
      "Commercial potential and team capability",
    ],
    complianceChecks: [
      "Technical innovation and feasibility are explicit.",
      "Customer discovery or market validation evidence is present.",
      "Broader impact or societal value is visible.",
      "Commercial potential and go-to-market path are credible.",
      "Team capability maps to technical and business execution.",
    ],
    suggestedTone: "Innovation-led and evidence-backed. Pair technical merit with market discovery and commercial potential.",
    transitionEmphasis: "High. NSF reviewers expect credible market validation, customer discovery, and commercialization logic.",
  }),
  profile({
    key: "customMultiAgency",
    label: "Custom / Multi-Agency",
    agency: "Multi-Agency",
    program: "SBIR/STTR or BAA",
    requiredSections: ["problemNeed", "objectivesSpecificAims", "technicalApproach", "workPlan", "commercializationTransition"],
    optionalSections: allSections.filter(
      (key) => !["problemNeed", "objectivesSpecificAims", "technicalApproach", "workPlan", "commercializationTransition"].includes(key),
    ),
    evaluationWeights: DEFAULT_EVALUATION_WEIGHTS,
    evaluationEmphasis: [
      "Pasted solicitation instructions",
      "Explicit evaluation criteria mapping",
      "Agency-specific compliance requirements",
      "Commercialization, transition, or public benefit as required by the opportunity",
    ],
    complianceChecks: [
      "Required sections match the pasted solicitation instructions.",
      "Evaluation criteria are explicitly addressed.",
      "Compliance and submission requirements are manually verified.",
      "Commercialization or transition expectations are clear for the agency.",
    ],
    suggestedTone: "Clear, criterion-mapped, and agency-neutral until the pasted instructions indicate otherwise.",
    transitionEmphasis: "Balanced. Follow the custom solicitation, then strengthen end-user, market, and follow-on funding evidence.",
  }),
];

export const DEFAULT_SOLICITATION_PROFILE_KEY: SolicitationProfileKey = "afwerxOpenTopic";

const LEGACY_PROFILE_ALIASES: Partial<Record<SolicitationProfileKey | string, SolicitationProfileKey>> = {
  dafSpecificTopic: "afwerxOpenTopic",
};

export const SOLICITATION_PROFILE_OPTIONS = SOLICITATION_PROFILES.map(({ key, label }) => ({ key, label }));

export const getSolicitationProfile = (key: SolicitationProfileKey | string | undefined) => {
  const normalizedKey = (key && LEGACY_PROFILE_ALIASES[key]) || key || DEFAULT_SOLICITATION_PROFILE_KEY;

  return (
    SOLICITATION_PROFILES.find((profileConfig) => profileConfig.key === normalizedKey) ??
    SOLICITATION_PROFILES.find((profileConfig) => profileConfig.key === DEFAULT_SOLICITATION_PROFILE_KEY)!
  );
};

// Dynamic section profiles store visibility/status separately from section content.
// Switching profiles updates this status map only; project.sections keeps every draft,
// including hidden saved sections, so content survives profile changes and custom toggles.
export const getSectionStatusesForProfile = (
  key: SolicitationProfileKey | string | undefined,
  existingStatuses?: VolumeSectionStatusMap,
): Record<VolumeSectionKey, VolumeSectionStatus> => {
  const selectedProfile = getSolicitationProfile(key);
  const defaultStatuses = allSections.reduce(
    (map, sectionKey) => ({
      ...map,
      [sectionKey]: selectedProfile.requiredSections.includes(sectionKey)
        ? "required"
        : selectedProfile.optionalSections.includes(sectionKey)
          ? "optional"
          : "hidden",
    }),
    {} as Record<VolumeSectionKey, VolumeSectionStatus>,
  );

  if (selectedProfile.key !== "customMultiAgency") return defaultStatuses;

  return allSections.reduce(
    (map, sectionKey) => ({
      ...map,
      [sectionKey]: existingStatuses?.[sectionKey] ?? defaultStatuses[sectionKey],
    }),
    {} as Record<VolumeSectionKey, VolumeSectionStatus>,
  );
};

export const getVisibleSectionKeys = (statuses: VolumeSectionStatusMap) =>
  allSections.filter((key) => statuses[key] !== "hidden");

export const getRequiredSectionKeys = (statuses: VolumeSectionStatusMap) =>
  allSections.filter((key) => statuses[key] === "required");

export const getOptionalSectionKeys = (statuses: VolumeSectionStatusMap) =>
  allSections.filter((key) => statuses[key] === "optional");

export const getProfileDefaults = (key: SolicitationProfileKey | string | undefined) => {
  const selectedProfile = getSolicitationProfile(key);

  return {
    solicitationProfile: selectedProfile.key,
    agency: selectedProfile.agency,
    program: selectedProfile.program,
    submissionRequirements: selectedProfile.submissionRequirements,
    evaluationWeights: selectedProfile.evaluationWeights,
    sectionStatuses: getSectionStatusesForProfile(selectedProfile.key),
  };
};
