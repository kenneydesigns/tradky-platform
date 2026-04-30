export const DAF_AFWERX_RUBRIC_CATEGORY_KEYS: readonly ["commercialization", "defenseNeed", "technicalMerit"];

export type DafAfwerxRubricCategoryKey = (typeof DAF_AFWERX_RUBRIC_CATEGORY_KEYS)[number];

export type DafAfwerxRubricCriterion = {
  title: string;
  helpfulQuestions: string[];
  phase2Only?: boolean;
  ratings: Record<1 | 2 | 3 | 4 | 5, string>;
};

export type DafAfwerxRubricCategory = {
  key: DafAfwerxRubricCategoryKey;
  title: string;
  criteria: DafAfwerxRubricCriterion[];
};

export const DAF_AFWERX_SCORE_LABELS: Record<1 | 2 | 3 | 4 | 5, string>;
export const DAF_AFWERX_RUBRIC: DafAfwerxRubricCategory[];
export const DAF_AFWERX_COST_VOLUME_CHECKS: readonly string[];
export const getDafAfwerxRatingLabel: (score: number) => string;
export const getDafAfwerxReadinessScore: (scores: number[]) => number;
export const DAF_AFWERX_RUBRIC_PROMPT: string;
