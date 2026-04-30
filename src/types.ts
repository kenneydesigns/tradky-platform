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

export type EvaluationResult = {
  generatedAt: string;
  readinessScore: number;
  confidenceNote: string;
  strengths: string[];
  weaknesses: string[];
  complianceGaps: string[];
  technicalMerit: string[];
  commercialization: string[];
  transitionPotential: string[];
  rewriteActions: string[];
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
