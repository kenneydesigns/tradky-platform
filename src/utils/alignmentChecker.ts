import { AlignmentFinding, AlignmentStatus, Project, VolumeSectionKey } from "../types";
import { isSectionVisible } from "./sectionVisibility";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "because",
  "between",
  "could",
  "during",
  "from",
  "have",
  "into",
  "more",
  "must",
  "need",
  "other",
  "phase",
  "proposal",
  "provide",
  "section",
  "should",
  "system",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "using",
  "with",
  "will",
  "work",
]);

const contentFor = (project: Project, key: VolumeSectionKey) =>
  project.sections.find((section) => section.key === key)?.content.trim() ?? "";

const hasAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

const keywords = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word))
    .slice(0, 80);

const overlapScore = (left: string, right: string) => {
  const leftTerms = [...new Set(keywords(left))];
  const rightTerms = new Set(keywords(right));
  if (!leftTerms.length || !rightTerms.size) return 0;

  return leftTerms.filter((term) => rightTerms.has(term)).length / Math.min(leftTerms.length, rightTerms.size);
};

const finding = (
  id: string,
  title: string,
  status: AlignmentStatus,
  detail: string,
  recommendation: string,
  relatedSections: VolumeSectionKey[],
): AlignmentFinding => ({
  id,
  title,
  status,
  detail,
  recommendation,
  relatedSections,
});

const statusForOverlap = (score: number, missing: boolean): AlignmentStatus => {
  if (missing) return "High Risk";
  if (score < 0.08) return "High Risk";
  if (score < 0.16) return "Warning";
  return "Aligned";
};

export const analyzeCrossSectionAlignment = (project: Project): AlignmentFinding[] => {
  const problem = contentFor(project, "problemNeed");
  const approach = contentFor(project, "technicalApproach");
  const workPlan = contentFor(project, "workPlan");
  const risks = contentFor(project, "risks");
  const transition = contentFor(project, "commercializationTransition");
  const team = contentFor(project, "team");
  const problemApproachScore = overlapScore(problem, approach);
  const riskApproachScore = overlapScore(risks, approach);
  const teamApproachScore = overlapScore(team, approach);
  const hasTasks = hasAny(workPlan, [/\btask\b/i, /\bobjective\b/i, /\bmilestone\b/i, /\bdeliverable\b/i]);
  const hasApproachObjectives = hasAny(approach, [/\bobjective\b/i, /\btest\b/i, /\bvalidate\b/i, /\bprototype\b/i, /\barchitecture\b/i]);
  const hasMetrics = hasAny(`${approach} ${workPlan}`, [/\b\d+(?:\.\d+)?%?\b/i, /\bmetric\b/i, /\bthreshold\b/i, /\bacceptance criteria\b/i]);
  const hasDeliverables = hasAny(workPlan, [/\bdeliverable\b/i, /\bdemo\b/i, /\bprototype\b/i, /\breport\b/i, /\bdata package\b/i]);
  const hasCustomer = hasAny(`${problem} ${transition}`, [/\bcustomer\b/i, /\bend user\b/i, /\bmission owner\b/i, /\bbuyer\b/i, /\bprogram office\b/i]);
  const hasCommercialPath = hasAny(transition, [/\bmarket\b/i, /\brevenue\b/i, /\btransition\b/i, /\bphase iii\b/i, /\bacquisition\b/i, /\binfusion\b/i]);
  const hasRoleMapping = hasAny(team, [/\blead\b/i, /\bresponsible\b/i, /\bown\b/i, /\bexperience\b/i, /\bexpertise\b/i]);

  return [
    finding(
      "problem-approach",
      "Problem matches technical approach",
      statusForOverlap(problemApproachScore, !problem || !approach),
      !problem || !approach
        ? "The problem and technical approach both need content before alignment can be verified."
        : problemApproachScore >= 0.16
          ? "The problem and approach share enough language to appear connected."
          : "The approach does not visibly answer the same problem terms used in the need statement.",
      "Carry the same customer, capability gap, baseline, and performance terms from the problem into the approach.",
      ["problemNeed", "technicalApproach"],
    ),
    finding(
      "workplan-objectives",
      "Work plan supports objectives",
      hasTasks && hasApproachObjectives ? "Aligned" : hasTasks || hasApproachObjectives ? "Warning" : "High Risk",
      hasTasks && hasApproachObjectives
        ? "The work plan and approach both contain objective, task, test, milestone, or deliverable language."
        : "Objectives and work plan execution are not tightly connected yet.",
      "Turn technical objectives into named tasks with deliverables, timing, owners, and go/no-go criteria.",
      ["technicalApproach", "workPlan"],
    ),
    finding(
      "metrics-deliverables",
      "Metrics tied to deliverables",
      hasMetrics && hasDeliverables ? "Aligned" : hasMetrics || hasDeliverables ? "Warning" : "High Risk",
      hasMetrics && hasDeliverables
        ? "Metrics and deliverable signals are both present."
        : "Metrics and deliverables are not clearly paired.",
      "For each deliverable, state the metric, target, test method, and acceptance threshold.",
      ["technicalApproach", "workPlan"],
    ),
    finding(
      "risks-approach",
      "Risks match technical approach",
      statusForOverlap(riskApproachScore, !risks || !approach),
      !risks || !approach
        ? "The risk and approach sections both need content before risk alignment can be verified."
        : riskApproachScore >= 0.16
          ? "Risk language appears tied to the technical approach."
          : "Risks look generic or disconnected from the technical approach.",
      "Name risks that correspond to the actual architecture, experiments, data, integrations, or customer constraints.",
      ["technicalApproach", "risks"],
    ),
    finding(
      "commercialization-customer",
      "Commercialization path matches customer",
      hasCustomer && hasCommercialPath ? "Aligned" : hasCustomer || hasCommercialPath ? "Warning" : "High Risk",
      hasCustomer && hasCommercialPath
        ? "Customer and commercialization or transition path signals are both visible."
        : "The commercialization path does not yet map to a named customer or end user.",
      "Connect customer pain, buyer type, adoption trigger, market path, and follow-on funding in one transition chain.",
      ["problemNeed", "commercializationTransition"],
    ),
    finding(
      "team-approach",
      "Team experience supports proposed work",
      hasRoleMapping && teamApproachScore >= 0.12 ? "Aligned" : hasRoleMapping || teamApproachScore >= 0.08 ? "Warning" : "High Risk",
      hasRoleMapping && teamApproachScore >= 0.12
        ? "Team language appears to support the proposed work."
        : "The team section does not yet prove the team can execute the proposed technical work.",
      "Map named roles, prior experience, facilities, and partners to the work plan and highest-risk technical tasks.",
      ["team", "technicalApproach", "workPlan"],
    ),
  ].filter((item) => item.relatedSections.every((sectionKey) => isSectionVisible(project, sectionKey)));
};
