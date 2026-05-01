import { VolumeSectionKey } from "../types";

export const SECTION_PURPOSES: Record<VolumeSectionKey, string> = {
  problemNeed:
    "Establish the mission, market, research, or operational problem; quantify the gap; and explain why the selected solicitation should fund this effort now.",
  objectivesSpecificAims:
    "Translate the problem into testable objectives or specific aims with methods, expected evidence, and success thresholds.",
  technicalApproach:
    "Explain the technical method, architecture, assumptions, validation plan, and why the approach is sound and feasible.",
  innovation:
    "Show what is novel, differentiated, or defensible compared with incumbent alternatives, prior art, or current practice.",
  workPlan:
    "Organize the effort into tasks, milestones, owners, deliverables, timing, and decision gates that retire the highest risks.",
  expectedOutcomesDeliverables:
    "Define the concrete artifacts, outcomes, acceptance criteria, and decision value reviewers should expect by the end of the phase.",
  evaluationMetricsSuccessCriteria:
    "Specify baselines, target thresholds, tests, data sources, and pass/fail criteria that will prove feasibility and value.",
  relatedWorkPriorRd:
    "Summarize relevant prior work, preliminary data, related research, and the remaining gap this project will close.",
  team:
    "Map personnel, partners, advisors, and subcontractors to the work they own and the qualifications that reduce execution risk.",
  facilitiesEquipmentResources:
    "Show that required facilities, equipment, datasets, software, labs, and test resources are available or have a credible access plan.",
  commercializationTransition:
    "Describe the market, customer, buyer, adoption path, revenue or transition logic, and evidence needed for follow-on activity.",
  customerDiscoveryEndUserValidation:
    "Document end-user, customer, buyer, partner, or stakeholder evidence and connect those findings to requirements and adoption.",
  phaseIToPhaseIITransition:
    "Explain how Phase I evidence will support the next funding, prototype, validation, customer, or adoption milestone.",
  risks:
    "Identify the highest technical, schedule, budget, compliance, and adoption risks, with mitigations, fallbacks, and residual-risk logic.",
  securityComplianceCyber:
    "Address applicable security, compliance, cyber, privacy, regulatory, export, or authorization constraints and owners.",
  dataRightsIpStrategy:
    "Clarify background IP, foreground IP, data rights, licenses, government rights, and defensibility for adoption and commercialization.",
  budgetNarrative:
    "Justify labor, materials, equipment, travel, subcontractors, and other costs by tying each category to the technical work.",
  referencesCitations:
    "Provide a concise evidence trail for technical, scientific, regulatory, market, prior-art, and standards-based claims.",
};

export const getSectionPurpose = (key: VolumeSectionKey) => SECTION_PURPOSES[key];
