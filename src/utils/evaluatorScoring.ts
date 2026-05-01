import {
  EvaluatorCriterionKey,
  EvaluatorCriterionScore,
  EvaluationWeights,
  Project,
  ProposalEvaluatorScore,
  SectionEvaluatorScore,
  VolumeSection,
} from "../types";
import { getSolicitationProfile } from "../data/solicitationProfiles";
import { getProjectRequiredSectionKeys, getProjectVisibleSections } from "./sectionVisibility";

const CRITERION_LABELS: Record<EvaluatorCriterionKey, string> = {
  solicitationFit: "Solicitation fit",
  technicalMerit: "Technical merit",
  feasibility: "Feasibility",
  innovation: "Innovation",
  evidenceSupport: "Evidence/support",
  metrics: "Metrics",
  transitionPotential: "Transition potential",
  riskAwareness: "Risk awareness",
  clarity: "Clarity",
};

const CRITERION_PATTERNS: Record<EvaluatorCriterionKey, RegExp[]> = {
  solicitationFit: [/\bsolicitation|topic|requirement|criterion|criteria|subtopic|baa|agency\b/i],
  technicalMerit: [/\barchitecture|algorithm|model|prototype|system|method|design|technical approach|research\b/i],
  feasibility: [/\bfeasible|feasibility|task|milestone|schedule|month|deliverable|prototype|validate|demonstrate\b/i],
  innovation: [/\bnovel|innovative|differentiated|unique|state of the art|breakthrough|ip|patent|alternative|incumbent\b/i],
  evidenceSupport: [/\bdata|evidence|tested|validated|benchmark|pilot|customer discovery|letter|loi|citation|result\b/i],
  metrics: [/\b\d+(?:\.\d+)?%?\b|\bmetric|threshold|baseline|target|kpi|success criteria|acceptance criteria|trl\b/i],
  transitionPotential: [/\btransition|customer|buyer|market|revenue|phase iii|procurement|acquisition|program office|infusion\b/i],
  riskAwareness: [/\brisk|mitigation|fallback|contingency|assumption|dependency|likelihood|impact\b/i],
  clarity: [/\bobjective|therefore|because|will|deliver|result|outcome\b/i],
};

const LOW_SCORE_FIXES: Record<EvaluatorCriterionKey, string> = {
  solicitationFit: "Quote or paraphrase the solicitation requirement, then show exactly how this section satisfies it.",
  technicalMerit: "Add architecture, method, technical assumptions, experiments, and why the approach is sound.",
  feasibility: "Turn the claim into tasks, milestones, responsible owners, and go/no-go decision points.",
  innovation: "Compare against current alternatives and state the specific technical differentiation.",
  evidenceSupport: "Add data, prior results, customer evidence, tests, citations, or bracketed placeholders for required proof.",
  metrics: "Add baseline, target, threshold, test method, and measurable acceptance criteria.",
  transitionPotential: "Name the customer, use case, buyer, adoption event, follow-on funder, or Phase III route.",
  riskAwareness: "Pair each major risk with likelihood, impact, mitigation, fallback plan, and residual-risk rationale.",
  clarity: "Open with the evaluator takeaway, then use shorter paragraphs and concrete evidence-bearing sentences.",
};

const HIGH_SCORE_STRENGTHS: Record<EvaluatorCriterionKey, string> = {
  solicitationFit: "Solicitation fit is visible enough for a reviewer to connect the section to the opportunity.",
  technicalMerit: "Technical logic is concrete and can support a merit score.",
  feasibility: "Execution path includes feasibility evidence through tasks, milestones, or deliverables.",
  innovation: "The section signals a differentiated approach instead of a generic solution.",
  evidenceSupport: "The section contains evidence language that can support claims.",
  metrics: "Measurable criteria are present.",
  transitionPotential: "Transition or commercialization path is visible.",
  riskAwareness: "Risk awareness is visible and can support reviewer confidence.",
  clarity: "The section is readable enough for a non-specialist evaluator to follow.",
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const hasPattern = (content: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(content));

const normalizeWeights = (weights: EvaluationWeights) => {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total]),
  ) as Record<EvaluatorCriterionKey, number>;
};

const solicitationTermScore = (sectionText: string, project: Project) => {
  const sourceTerms = [
    ...project.solicitationText
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 5)
      .slice(0, 80),
    project.agency.toLowerCase(),
    project.program.toLowerCase(),
  ].filter(Boolean);
  const uniqueTerms = [...new Set(sourceTerms)];
  if (!uniqueTerms.length) return project.topicId || project.solicitationNumber ? 62 : 42;

  const lower = sectionText.toLowerCase();
  const matches = uniqueTerms.filter((term) => lower.includes(term)).length;
  return clamp(40 + Math.min(40, matches * 8));
};

const clarityScore = (content: string) => {
  const words = countWords(content);
  if (!words) return 0;

  const paragraphs = content.split(/\n{2,}/).map((paragraph) => countWords(paragraph)).filter(Boolean);
  const averageParagraphWords = paragraphs.length ? paragraphs.reduce((sum, value) => sum + value, 0) / paragraphs.length : words;
  const hasDraftPlaceholder = /\btbd|todo|placeholder|insert\b/i.test(content);
  const lengthScore = words >= 80 ? 34 : Math.min(34, words * 0.42);
  const paragraphScore = averageParagraphWords <= 130 ? 30 : Math.max(8, 30 - (averageParagraphWords - 130) * 0.12);
  const structureScore = /\n|:|;|\bfirst\b|\bsecond\b|\btask\b|\bobjective\b/i.test(content) ? 18 : 8;
  const penalty = hasDraftPlaceholder ? 18 : 0;

  return clamp(28 + lengthScore + paragraphScore + structureScore - penalty);
};

const criterionScore = (key: EvaluatorCriterionKey, section: VolumeSection, project: Project) => {
  const content = section.content.trim();
  if (!content) return 0;

  if (key === "solicitationFit") {
    const patternBoost = hasPattern(content, CRITERION_PATTERNS[key]) ? 16 : 0;
    return clamp(solicitationTermScore(content, project) + patternBoost);
  }

  if (key === "clarity") return clarityScore(content);

  const patterns = CRITERION_PATTERNS[key];
  const patternScore = hasPattern(content, patterns) ? 64 : 30;
  const numberBoost = /\b\d+(?:\.\d+)?%?\b/.test(content) ? 10 : 0;
  const evidenceBoost = /\bdata|test|validate|customer|deliverable|milestone|evidence\b/i.test(content) ? 12 : 0;
  const sectionSpecificBoost =
    (section.key === "innovation" && key === "innovation") ||
    (section.key === "risks" && key === "riskAwareness") ||
    (section.key === "commercializationTransition" && key === "transitionPotential") ||
    (section.key === "customerDiscoveryEndUserValidation" && key === "transitionPotential") ||
    (section.key === "phaseIToPhaseIITransition" && key === "transitionPotential") ||
    (section.key === "evaluationMetricsSuccessCriteria" && key === "metrics") ||
    (section.key === "expectedOutcomesDeliverables" && key === "feasibility") ||
    (section.key === "objectivesSpecificAims" && key === "feasibility") ||
    (section.key === "relatedWorkPriorRd" && key === "evidenceSupport") ||
    (section.key === "facilitiesEquipmentResources" && key === "feasibility") ||
    (section.key === "securityComplianceCyber" && key === "riskAwareness") ||
    (section.key === "dataRightsIpStrategy" && key === "innovation") ||
    (section.key === "technicalApproach" && key === "technicalMerit") ||
    (section.key === "workPlan" && key === "feasibility")
      ? 10
      : 0;

  return clamp(patternScore + numberBoost + evidenceBoost + sectionSpecificBoost);
};

const criterionRationale = (key: EvaluatorCriterionKey, score: number) => {
  if (score >= 75) return HIGH_SCORE_STRENGTHS[key];
  if (score >= 55) return `${CRITERION_LABELS[key]} is present but not yet strong enough to carry reviewer confidence.`;
  return LOW_SCORE_FIXES[key];
};

const scoreSection = (section: VolumeSection, project: Project, weights: EvaluationWeights): SectionEvaluatorScore => {
  const normalizedWeights = normalizeWeights(weights);
  const criteria = (Object.keys(weights) as EvaluatorCriterionKey[]).map<EvaluatorCriterionScore>((key) => {
    const score = criterionScore(key, section, project);

    return {
      key,
      title: CRITERION_LABELS[key],
      score,
      weight: weights[key],
      rationale: criterionRationale(key, score),
    };
  });
  const score = clamp(criteria.reduce((sum, item) => sum + item.score * normalizedWeights[item.key], 0));
  const strongest = criteria.filter((item) => item.score >= 75).sort((a, b) => b.score - a.score).slice(0, 2);
  const weakest = criteria.filter((item) => item.score < 58).sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    key: section.key,
    title: section.title,
    score: section.content.trim() ? score : 0,
    criteria,
    majorStrengths: strongest.length ? strongest.map((item) => item.rationale) : ["No major evaluator strengths are visible yet."],
    majorWeaknesses: weakest.length ? weakest.map((item) => item.rationale) : ["No major score-limiting weakness detected by the local scorer."],
    recommendedFixes: weakest.length
      ? weakest.map((item) => LOW_SCORE_FIXES[item.key])
      : ["Sharpen reviewer-facing evidence and keep claims tied to measurable outcomes."],
  };
};

export const scoreProposalEvaluator = (project: Project): ProposalEvaluatorScore => {
  const profile = getSolicitationProfile(project.solicitationProfile);
  const weights = project.evaluationWeights ?? profile.evaluationWeights;
  const requiredKeys = new Set(getProjectRequiredSectionKeys(project));
  const sectionScores = getProjectVisibleSections(project).map((section) => scoreSection(section, project, weights));
  const scoreableSections = requiredKeys.size ? sectionScores.filter((section) => requiredKeys.has(section.key)) : sectionScores;
  const overallScore = scoreableSections.length
    ? clamp(scoreableSections.reduce((sum, section) => sum + section.score, 0) / scoreableSections.length)
    : 0;
  const sortedStrengths = sectionScores
    .flatMap((section) => section.majorStrengths.map((item) => `${section.title}: ${item}`))
    .filter((item) => !item.includes("No major evaluator strengths"))
    .slice(0, 5);
  const sortedWeaknesses = [...sectionScores]
    .sort((a, b) => a.score - b.score)
    .flatMap((section) => section.majorWeaknesses.map((item) => `${section.title}: ${item}`))
    .filter((item) => !item.includes("No major score-limiting weakness"))
    .slice(0, 5);
  const recommendedFixes = [...sectionScores]
    .sort((a, b) => a.score - b.score)
    .flatMap((section) => section.recommendedFixes.map((item) => `${section.title}: ${item}`))
    .slice(0, 6);

  return {
    overallScore,
    sectionScores,
    majorStrengths: sortedStrengths.length ? sortedStrengths : ["Reviewer-facing strengths will appear once the sections contain evidence."],
    majorWeaknesses: sortedWeaknesses.length ? sortedWeaknesses : ["No major evaluator weaknesses detected by the local scorer."],
    recommendedFixes: recommendedFixes.length ? recommendedFixes : ["Add solicitation fit, evidence, metrics, transition, and risk logic."],
  };
};
