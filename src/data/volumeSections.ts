import { VolumeSection } from "../types";

export const defaultVolumeSections: VolumeSection[] = [
  {
    key: "problemNeed",
    title: "Problem / Need",
    content: "",
  },
  {
    key: "objectivesSpecificAims",
    title: "Objectives / Specific Aims",
    content: "",
  },
  {
    key: "technicalApproach",
    title: "Technical Approach",
    content: "",
  },
  {
    key: "innovation",
    title: "Innovation",
    content: "",
  },
  {
    key: "workPlan",
    title: "Work Plan",
    content: "",
  },
  {
    key: "expectedOutcomesDeliverables",
    title: "Expected Outcomes / Deliverables",
    content: "",
  },
  {
    key: "evaluationMetricsSuccessCriteria",
    title: "Evaluation Metrics / Success Criteria",
    content: "",
  },
  {
    key: "relatedWorkPriorRd",
    title: "Related Work / Prior R&D",
    content: "",
  },
  {
    key: "team",
    title: "Team",
    content: "",
  },
  {
    key: "facilitiesEquipmentResources",
    title: "Facilities / Equipment / Resources",
    content: "",
  },
  {
    key: "commercializationTransition",
    title: "Commercialization / Transition",
    content: "",
  },
  {
    key: "customerDiscoveryEndUserValidation",
    title: "Customer Discovery / End User Validation",
    content: "",
  },
  {
    key: "phaseIToPhaseIITransition",
    title: "Phase I to Phase II Transition Plan",
    content: "",
  },
  {
    key: "risks",
    title: "Risks",
    content: "",
  },
  {
    key: "securityComplianceCyber",
    title: "Security / Compliance / Cyber",
    content: "",
  },
  {
    key: "dataRightsIpStrategy",
    title: "Data Rights / IP Strategy",
    content: "",
  },
  {
    key: "budgetNarrative",
    title: "Budget Narrative",
    content: "",
  },
  {
    key: "referencesCitations",
    title: "References / Citations",
    content: "",
  },
];

export const VOLUME_SECTION_KEYS = defaultVolumeSections.map((section) => section.key);

export const getVolumeSectionTitle = (key: VolumeSection["key"]) =>
  defaultVolumeSections.find((section) => section.key === key)?.title ?? key;
