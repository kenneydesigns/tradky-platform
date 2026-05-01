import { VolumeSection, VolumeSectionKey } from "../types";

export type SectionStrength = {
  score: number;
  label: string;
  details: string[];
  missingSignals: string[];
};

const SECTION_TARGET_WORDS: Record<VolumeSectionKey, number> = {
  problemNeed: 180,
  objectivesSpecificAims: 180,
  technicalApproach: 260,
  innovation: 160,
  workPlan: 320,
  expectedOutcomesDeliverables: 160,
  evaluationMetricsSuccessCriteria: 150,
  relatedWorkPriorRd: 180,
  team: 160,
  facilitiesEquipmentResources: 150,
  commercializationTransition: 240,
  customerDiscoveryEndUserValidation: 170,
  phaseIToPhaseIITransition: 170,
  risks: 170,
  securityComplianceCyber: 150,
  dataRightsIpStrategy: 130,
  budgetNarrative: 150,
  referencesCitations: 100,
};

const SECTION_SIGNALS: Record<VolumeSectionKey, Array<{ pattern: RegExp; label: string }>> = {
  problemNeed: [
    { pattern: /\b(customer|warfighter|user|stakeholder|mission)\b/i, label: "named user or mission owner" },
    { pattern: /\b(gap|pain|need|shortfall|limitation)\b/i, label: "clear problem gap" },
    { pattern: /\b(now|urgent|current|today|increasing|emerging)\b/i, label: "urgency" },
  ],
  objectivesSpecificAims: [
    { pattern: /\b(objective|aim|goal|hypothesis)\b/i, label: "clear objectives or aims" },
    { pattern: /\b(measure|validate|test|demonstrate|determine)\b/i, label: "testable action verbs" },
    { pattern: /\b(success|milestone|deliverable|threshold|criteria)\b/i, label: "aim-level success criteria" },
  ],
  technicalApproach: [
    { pattern: /\b(hypothesis|architecture|prototype|model|algorithm|system)\b/i, label: "technical method" },
    { pattern: /\b(test|validate|experiment|measure|benchmark|threshold)\b/i, label: "validation plan" },
    { pattern: /\b(success criteria|metric|kpi|performance|accuracy|latency|trl)\b/i, label: "measurable criteria" },
  ],
  innovation: [
    { pattern: /\b(novel|innovative|differentiated|state of the art|unique)\b/i, label: "novelty claim" },
    { pattern: /\b(compared|alternative|incumbent|baseline|existing)\b/i, label: "comparison to alternatives" },
    { pattern: /\b(defensible|ip|patent|trade secret|barrier)\b/i, label: "defensibility" },
  ],
  workPlan: [
    { pattern: /\b(task|phase|objective|milestone)\b/i, label: "task structure" },
    { pattern: /\b(deliverable|output|report|prototype|demo)\b/i, label: "deliverables" },
    { pattern: /\b(month|week|schedule|timeline|go\/no-go|gate)\b/i, label: "timing or decision gates" },
  ],
  expectedOutcomesDeliverables: [
    { pattern: /\b(outcome|result|deliverable|output)\b/i, label: "defined outcomes" },
    { pattern: /\b(prototype|report|data package|demo|model|software)\b/i, label: "concrete deliverables" },
    { pattern: /\b(acceptance|success|threshold|measure|criteria)\b/i, label: "acceptance criteria" },
  ],
  evaluationMetricsSuccessCriteria: [
    { pattern: /\b(metric|kpi|measure|threshold|baseline)\b/i, label: "metrics and baselines" },
    { pattern: /\b(success criteria|acceptance criteria|pass\/fail|target)\b/i, label: "success criteria" },
    { pattern: /\b(test|validate|evaluate|benchmark|demonstrate)\b/i, label: "evaluation method" },
  ],
  relatedWorkPriorRd: [
    { pattern: /\b(prior|previous|preliminary|related work|background)\b/i, label: "prior work context" },
    { pattern: /\b(result|data|prototype|study|publication|pilot)\b/i, label: "evidence from prior R&D" },
    { pattern: /\b(gap|limitation|advance|differentiat)\b/i, label: "gap from prior art" },
  ],
  team: [
    { pattern: /\b(principal investigator|pi|lead|engineer|scientist|advisor|partner)\b/i, label: "named roles" },
    { pattern: /\b(experience|expertise|qualification|track record|prior)\b/i, label: "relevant qualifications" },
    { pattern: /\b(own|responsible|lead|manage|support)\b/i, label: "ownership mapping" },
  ],
  facilitiesEquipmentResources: [
    { pattern: /\b(facilit|lab|laboratory|equipment|instrument|resource)\b/i, label: "facilities and equipment" },
    { pattern: /\b(access|available|dedicated|secured|licensed)\b/i, label: "availability of resources" },
    { pattern: /\b(test|prototype|experiment|manufactur|compute|clinical)\b/i, label: "resources tied to work" },
  ],
  commercializationTransition: [
    { pattern: /\b(customer|buyer|market|segment|use case)\b/i, label: "target customer or market" },
    { pattern: /\b(transition|program office|acquisition|procurement|phase iii)\b/i, label: "transition path" },
    { pattern: /\b(revenue|pricing|pilot|partner|adoption)\b/i, label: "commercial adoption path" },
  ],
  customerDiscoveryEndUserValidation: [
    { pattern: /\b(customer|end user|stakeholder|interview|discovery)\b/i, label: "customer discovery evidence" },
    { pattern: /\b(validation|letter|memo|pilot|feedback|commitment)\b/i, label: "end-user validation" },
    { pattern: /\b(use case|workflow|pain point|requirement|buyer)\b/i, label: "validated use case" },
  ],
  phaseIToPhaseIITransition: [
    { pattern: /\b(phase i|phase 1|phase ii|phase 2)\b/i, label: "phase bridge" },
    { pattern: /\b(transition|scale|prototype|follow-on|next phase)\b/i, label: "next-phase path" },
    { pattern: /\b(milestone|evidence|deliverable|readiness|trl)\b/i, label: "transition evidence package" },
  ],
  risks: [
    { pattern: /\b(risk|dependency|assumption|uncertainty)\b/i, label: "specific risks" },
    { pattern: /\b(mitigation|reduce|monitor|manage)\b/i, label: "mitigations" },
    { pattern: /\b(fallback|contingency|alternative|impact|likelihood)\b/i, label: "fallback or impact" },
  ],
  securityComplianceCyber: [
    { pattern: /\b(security|cyber|compliance|regulatory|privacy)\b/i, label: "compliance domain" },
    { pattern: /\b(control|standard|requirement|cmmc|nist|itar|hipaa|human subjects)\b/i, label: "applicable standard" },
    { pattern: /\b(mitigation|plan|approval|protocol|assessment)\b/i, label: "compliance plan" },
  ],
  dataRightsIpStrategy: [
    { pattern: /\b(ip|intellectual property|patent|trade secret|copyright)\b/i, label: "IP position" },
    { pattern: /\b(data rights|rights|license|ownership|government purpose)\b/i, label: "data rights strategy" },
    { pattern: /\b(protect|defensible|freedom to operate|disclosure|background)\b/i, label: "protection strategy" },
  ],
  budgetNarrative: [
    { pattern: /\b(labor|personnel|hours|level of effort)\b/i, label: "labor basis" },
    { pattern: /\b(materials|equipment|software|travel|subcontract)\b/i, label: "cost categories" },
    { pattern: /\b(task|deliverable|work plan|objective)\b/i, label: "cost-to-work link" },
  ],
  referencesCitations: [
    { pattern: /\b(reference|citation|bibliography|source)\b/i, label: "citation structure" },
    { pattern: /\b(author|journal|conference|report|doi|url)\b/i, label: "source detail" },
    { pattern: /\b(prior|evidence|standard|study|published)\b/i, label: "evidence linkage" },
  ],
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const scoreLabel = (score: number) => {
  if (score >= 82) return "Complete";
  if (score >= 62) return "Mostly complete";
  if (score >= 38) return "Partial";
  return "Sparse";
};

export const analyzeSectionStrength = (section: VolumeSection): SectionStrength => {
  const content = section.content.trim();
  const words = countWords(content);

  if (!content) {
    return {
      score: 0,
      label: "Empty",
      details: ["0 words"],
      missingSignals: SECTION_SIGNALS[section.key].map((signal) => signal.label),
    };
  }

  const targetWords = SECTION_TARGET_WORDS[section.key];
  const wordScore = Math.min(36, (words / targetWords) * 36);
  const signals = SECTION_SIGNALS[section.key];
  const matchedSignals = signals.filter((signal) => signal.pattern.test(content));
  const missingSignals = signals.filter((signal) => !signal.pattern.test(content)).map((signal) => signal.label);
  const signalScore = (matchedSignals.length / signals.length) * 34;
  const hasNumbers = /\b\d+(?:\.\d+)?%?\b/.test(content);
  const hasStructure = /\n|(?:^|\s)(?:task|phase|step|objective|milestone|risk)\s+\d+/i.test(content);
  const hasEvidenceLanguage = /\b(data|evidence|test|validate|measure|baseline|threshold|customer|quote|requirement)\b/i.test(content);
  const score = clamp(wordScore + signalScore + (hasNumbers ? 10 : 0) + (hasStructure ? 10 : 0) + (hasEvidenceLanguage ? 10 : 0));

  return {
    score,
    label: scoreLabel(score),
    details: [
      `${words} words`,
      `${matchedSignals.length}/${signals.length} section signals`,
      hasNumbers ? "includes metrics" : "needs metrics",
    ],
    missingSignals,
  };
};
