import type { DafAfwerxRubricCategoryKey } from "./data/dafAfwerxRubric";

export type VolumeSectionKey =
  | "problemNeed"
  | "technicalApproach"
  | "innovation"
  | "workPlan"
  | "team"
  | "commercializationTransition"
  | "risks"
  | "budgetNarrative";

export type VolumeSection = {
  key: VolumeSectionKey;
  title: string;
  content: string;
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

export type RankedWeakness = {
  severity: WeaknessImpactLevel;
  weakness: string;
  selection_impact: string;
  consequence_if_not_fixed: string;
  why_prevents_funding: string;
  evaluator_interpretation: string;
};

export type MultiAgencyEvaluation = {
  agency_detected: string;
  fit_score: number;
  quality_score: number;
  funding_decision: FundingDecision;
  decision_rationale: string;
  primary_failure_reason: string;
  most_likely_rejection_issue: string;
  confidence: "High" | "Moderate" | "Low";
  confidence_reason: string;
  flags: string[];
  criteria: MultiAgencyCriterionEvaluation[];
  top_strengths: string[];
  top_weaknesses: string[];
  weakness_rankings: RankedWeakness[];
  priority_actions: string[];
};

export type Project = {
  id: string;
  name: string;
  agency: string;
  program: string;
  topicId: string;
  phase: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  solicitationText: string;
  proposalText: string;
  evaluation: EvaluationResult | null;
  sections: VolumeSection[];
};

export type ProjectInput = Pick<Project, "name" | "agency" | "program" | "topicId" | "phase" | "dueDate">;

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
};

export type SectionSuggestionsInput = {
  project: Project;
  sectionKeys?: VolumeSectionKey[];
};

export type SectionSuggestionsResult = {
  generatedAt: string;
  sections: SectionSuggestion[];
};
