import type { DafAfwerxRubricCategoryKey } from "./data/dafAfwerxRubric";

export type VolumeSectionKey =
  | "problemNeed"
  | "objectivesSpecificAims"
  | "technicalApproach"
  | "innovation"
  | "workPlan"
  | "expectedOutcomesDeliverables"
  | "evaluationMetricsSuccessCriteria"
  | "relatedWorkPriorRd"
  | "team"
  | "facilitiesEquipmentResources"
  | "commercializationTransition"
  | "customerDiscoveryEndUserValidation"
  | "phaseIToPhaseIITransition"
  | "risks"
  | "securityComplianceCyber"
  | "dataRightsIpStrategy"
  | "budgetNarrative"
  | "referencesCitations";

export type VolumeSectionStatus = "required" | "optional" | "hidden";

export type VolumeSectionStatusMap = Partial<Record<VolumeSectionKey, VolumeSectionStatus>>;

export type VolumeSection = {
  key: VolumeSectionKey;
  title: string;
  content: string;
};

export type SolicitationProfileKey =
  | "afwerxOpenTopic"
  | "dafSpecificTopic"
  | "armySbirSttr"
  | "navySbirSttr"
  | "darpaBaa"
  | "doeSbirSttr"
  | "nasaSbirSttr"
  | "nihSbirSttr"
  | "nsfSbirSttr"
  | "customMultiAgency";

export type EvaluatorCriterionKey =
  | "solicitationFit"
  | "technicalMerit"
  | "feasibility"
  | "innovation"
  | "evidenceSupport"
  | "metrics"
  | "transitionPotential"
  | "riskAwareness"
  | "clarity";

export type EvaluationWeights = Record<EvaluatorCriterionKey, number>;

export type SubmissionRequirements = {
  pageLimit: number;
  wordLimit: number;
  attachments: string[];
  notes: string[];
};

export type SolicitationProfileConfig = {
  key: SolicitationProfileKey;
  label: string;
  agency: string;
  program: string;
  requiredSections: VolumeSectionKey[];
  optionalSections: VolumeSectionKey[];
  hiddenSections: VolumeSectionKey[];
  evaluationWeights: EvaluationWeights;
  evaluationEmphasis: string[];
  complianceChecks: string[];
  requiredComplianceChecks: string[];
  suggestedTone: string;
  transitionEmphasis: string;
  submissionRequirements: SubmissionRequirements;
};

export type ComplianceStatus = "Pass" | "Warning" | "High Risk" | "Non-Compliant";

export type ComplianceFinding = {
  id: string;
  title: string;
  status: ComplianceStatus;
  detail: string;
  recommendation: string;
  relatedSections: VolumeSectionKey[];
};

export type EvaluatorCriterionScore = {
  key: EvaluatorCriterionKey;
  title: string;
  score: number;
  weight: number;
  rationale: string;
};

export type SectionEvaluatorScore = {
  key: VolumeSectionKey;
  title: string;
  score: number;
  criteria: EvaluatorCriterionScore[];
  majorStrengths: string[];
  majorWeaknesses: string[];
  recommendedFixes: string[];
};

export type ProposalEvaluatorScore = {
  overallScore: number;
  sectionScores: SectionEvaluatorScore[];
  majorStrengths: string[];
  majorWeaknesses: string[];
  recommendedFixes: string[];
};

export type AlignmentStatus = "Aligned" | "Warning" | "High Risk";

export type AlignmentFinding = {
  id: string;
  title: string;
  status: AlignmentStatus;
  detail: string;
  recommendation: string;
  relatedSections: VolumeSectionKey[];
};

export type ExportHistoryItem = {
  type: "technical-volume-markdown" | "technical-volume-docx" | "evaluation-markdown" | "evaluation-docx" | "evaluation-pdf";
  generatedAt: string;
};

export type DafAfwerxRubricScore = {
  key: DafAfwerxRubricCategoryKey | string;
  title: string;
  score: number;
  label: string;
  rationale: string;
  strengths: string[];
  gaps: string[];
};

export type CostVolumeCheck = {
  question: string;
  status: "YES" | "NO" | "N/A";
  rationale: string;
};

export type EvaluationResult = {
  generatedAt: string;
  readinessScore: number;
  confidenceNote: string;
  multiAgencyEvaluation?: MultiAgencyEvaluation;
  rubricScores?: DafAfwerxRubricScore[];
  costVolumeChecks?: CostVolumeCheck[];
  strengths: string[];
  weaknesses: string[];
  complianceGaps: string[];
  technicalMerit: string[];
  commercialization: string[];
  transitionPotential: string[];
  rewriteActions: string[];
};

export type MultiAgencyCriterionEvaluation = {
  name: string;
  score: number;
  evidence_present: "Yes" | "No";
  evidence_anchor: string;
  reason: string;
  gap: string;
  fix: string;
};

export type FundingDecision = "Select" | "Do Not Select";

export type WeaknessImpactLevel = "Critical" | "High" | "Medium" | "Low";

export type TopTenAssessment = {
  is_top_10_percent: "Yes" | "No";
  rationale: string;
};

export type ComplianceGate = {
  status: "Pass" | "Fail" | "Unknown";
  issues: string[];
  rationale: string;
};

export type DecisionDimensionScores = {
  customer_understanding: number;
  mission_impact: number;
  clarity_for_non_technical_audience: number;
  transition_and_scale: number;
};

export type TechFirstWritingAssessment = {
  detected: "Yes" | "No";
  severity: WeaknessImpactLevel;
  rationale: string;
  fix: string;
};

export type RankedWeakness = {
  severity: WeaknessImpactLevel;
  weakness: string;
  selection_impact: string;
  consequence_if_not_fixed: string;
  why_prevents_funding: string;
  evaluator_interpretation: string;
};

export type KeyRewrite = {
  problem: string;
  why_it_matters_to_non_technical_evaluator: string;
  before: string;
  after: string;
};

export type MultiAgencyEvaluation = {
  agency_detected: string;
  fit_score: number;
  quality_score: number;
  funding_decision: FundingDecision;
  decision_rationale: string;
  top_10_assessment: TopTenAssessment;
  primary_failure_reason: string;
  most_likely_rejection_issue: string;
  compliance_gate: ComplianceGate;
  dimension_scores: DecisionDimensionScores;
  tech_first_writing: TechFirstWritingAssessment;
  confidence: "High" | "Moderate" | "Low";
  confidence_reason: string;
  flags: string[];
  criteria: MultiAgencyCriterionEvaluation[];
  top_strengths: string[];
  top_weaknesses: string[];
  weakness_rankings: RankedWeakness[];
  key_rewrites: KeyRewrite[];
  priority_actions: string[];
  final_verdict: string;
};

export type Project = {
  id: string;
  name: string;
  agency: string;
  program: string;
  topicId: string;
  solicitationProfile: SolicitationProfileKey;
  solicitationNumber: string;
  phase: string;
  dueDate: string;
  releaseDate: string;
  openDate: string;
  closeDate: string;
  submissionRequirements: SubmissionRequirements;
  evaluationWeights: EvaluationWeights;
  customSolicitationInstructions: string;
  createdAt: string;
  updatedAt: string;
  solicitationText: string;
  proposalText: string;
  evaluation: EvaluationResult | null;
  sections: VolumeSection[];
  sectionStatuses: VolumeSectionStatusMap;
  completenessScore: number;
  evaluatorScore: number;
  complianceFindings: ComplianceFinding[];
  exportHistory: ExportHistoryItem[];
};

export type ProjectInput = Pick<Project, "name" | "agency" | "program" | "topicId" | "phase" | "dueDate"> &
  Partial<Pick<Project, "solicitationProfile" | "solicitationNumber">>;

export type EvaluateInput = {
  project: Project;
  solicitationText: string;
  proposalText: string;
};

export type DraftSectionsInput = {
  project: Project;
  sectionKeys?: VolumeSectionKey[];
};

export type DraftSectionsResult = {
  generatedAt: string;
  sections: VolumeSection[];
};

export type SectionSuggestion = {
  key: VolumeSectionKey;
  title: string;
  evaluatorScore: number;
  summary: string;
  suggestions: string[];
  reviewerFinding: string;
  whyItMatters: string;
  scoreImpact: string;
  rewriteRecommendation: string;
  improvedLanguageExample: string;
};

export type SectionSuggestionsInput = {
  project: Project;
  sectionKeys?: VolumeSectionKey[];
};

export type SectionSuggestionsResult = {
  generatedAt: string;
  sections: SectionSuggestion[];
};
