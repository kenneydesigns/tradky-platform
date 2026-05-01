import { Project, VolumeSection } from "../types";

export type EvidenceAnchorStatus = "present" | "placeholder" | "missing";

export type EvidenceAnchorFinding = {
  id: string;
  label: string;
  status: EvidenceAnchorStatus;
  detail: string;
};

export type EvidenceAnchorAssessment = {
  score: number;
  label: string;
  findings: EvidenceAnchorFinding[];
  placeholderCount: number;
};

const STOP_WORDS = new Set([
  "about",
  "across",
  "after",
  "against",
  "agency",
  "based",
  "before",
  "between",
  "current",
  "during",
  "effort",
  "evaluation",
  "following",
  "include",
  "mission",
  "proposal",
  "provide",
  "section",
  "should",
  "solution",
  "system",
  "technical",
  "through",
  "volume",
  "where",
  "which",
]);

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const containsAny = (text: string, terms: string[]) => {
  const lower = text.toLowerCase();
  return terms.some((term) => term && lower.includes(term.toLowerCase()));
};

const extractDistinctiveTerms = (text: string) => {
  const matches = text.toLowerCase().match(/\b[a-z][a-z0-9-]{6,}\b/g) ?? [];
  const terms = matches.filter((term) => !STOP_WORDS.has(term));
  return [...new Set(terms)].slice(0, 24);
};

const extractPlaceholders = (text: string) => text.match(/\[[^\]]+\]/g) ?? [];

const statusScore = (status: EvidenceAnchorStatus) => {
  if (status === "present") return 25;
  if (status === "placeholder") return 12;
  return 0;
};

const placeholderMentions = (placeholders: string[], terms: string[]) => containsAny(placeholders.join(" "), terms);

export const analyzeEvidenceAnchors = (project: Project, section: VolumeSection): EvidenceAnchorAssessment => {
  const content = section.content.trim();
  const placeholders = extractPlaceholders(content);
  const hasDraftContent = countWords(content) >= 35;
  const sourceText = [project.solicitationText, project.customSolicitationInstructions, project.proposalText]
    .filter(Boolean)
    .join(" ");
  const sourceTerms = extractDistinctiveTerms(sourceText);
  const metadataTerms = [
    project.topicId,
    project.solicitationNumber,
    project.agency,
    project.program,
    project.phase,
  ].filter((term): term is string => Boolean(term && term.trim().length > 2));
  const stakeholderTerms = [
    "customer",
    "end user",
    "mission owner",
    "buyer",
    "program office",
    "sponsor",
    "partner",
    "stakeholder",
    "warfighter",
    "airmen",
    "guardian",
    "patient",
    "operator",
  ];
  const evidenceTerms = [
    "interview",
    "letter",
    "memorandum",
    "pilot",
    "prototype",
    "test",
    "trial",
    "benchmark",
    "dataset",
    "citation",
    "study",
    "data",
    "metric",
    "threshold",
    "baseline",
    "target",
    "trl",
  ];
  const transitionTerms = [
    "transition",
    "commercialization",
    "phase ii",
    "phase iii",
    "revenue",
    "procurement",
    "adoption",
    "market",
    "follow-on",
  ];
  const hasNumber = /\b\d+(?:\.\d+)?\s?(?:%|x|k|m|mm|months?|days?|hours?|users?|units?|db|ms|sec|trl)?\b/i.test(content);

  const sourceStatus: EvidenceAnchorStatus =
    containsAny(content, [...metadataTerms, ...sourceTerms])
      ? "present"
      : placeholders.length && placeholderMentions(placeholders, ["topic", "solicitation", "agency", "requirement", "source"])
        ? "placeholder"
        : "missing";

  const stakeholderStatus: EvidenceAnchorStatus =
    containsAny(content, stakeholderTerms)
      ? "present"
      : placeholderMentions(placeholders, ["customer", "user", "buyer", "partner", "stakeholder", "sponsor"])
        ? "placeholder"
        : "missing";

  const measurableStatus: EvidenceAnchorStatus =
    hasNumber || containsAny(content, evidenceTerms)
      ? "present"
      : placeholderMentions(placeholders, ["metric", "threshold", "baseline", "target", "test", "data"])
        ? "placeholder"
        : "missing";

  const pathStatus: EvidenceAnchorStatus =
    containsAny(content, transitionTerms)
      ? "present"
      : placeholderMentions(placeholders, ["transition", "market", "revenue", "phase", "adoption"])
        ? "placeholder"
        : "missing";

  const findings: EvidenceAnchorFinding[] = [
    {
      id: "source",
      label: "Solicitation anchor",
      status: hasDraftContent ? sourceStatus : "missing",
      detail:
        sourceStatus === "present"
          ? "The section references project metadata or distinctive source language."
          : sourceStatus === "placeholder"
            ? "The section marks a source-specific fact that still needs to be filled."
            : "No clear topic, solicitation, or source-text anchor is visible yet.",
    },
    {
      id: "stakeholder",
      label: "Reviewer-verifiable stakeholder",
      status: hasDraftContent ? stakeholderStatus : "missing",
      detail:
        stakeholderStatus === "present"
          ? "A customer, end user, sponsor, buyer, or partner signal is present."
          : stakeholderStatus === "placeholder"
            ? "A stakeholder placeholder is present and needs a real source."
            : "No specific stakeholder or use-case owner is visible yet.",
    },
    {
      id: "measurable",
      label: "Measurable evidence",
      status: hasDraftContent ? measurableStatus : "missing",
      detail:
        measurableStatus === "present"
          ? "The section includes metrics, tests, thresholds, data, or numeric detail."
          : measurableStatus === "placeholder"
            ? "A metric or validation placeholder is present and needs a real value."
            : "The section lacks measurable validation evidence.",
    },
    {
      id: "transition",
      label: "Path to follow-on value",
      status: hasDraftContent ? pathStatus : "missing",
      detail:
        pathStatus === "present"
          ? "The section includes transition, commercialization, adoption, or follow-on value language."
          : pathStatus === "placeholder"
            ? "A transition or market placeholder is present and needs a real source."
            : "No transition, commercialization, adoption, or follow-on path is visible yet.",
    },
  ];

  const rawScore = findings.reduce((sum, finding) => sum + statusScore(finding.status), 0);
  const score = hasDraftContent ? rawScore : 0;
  const label =
    score >= 80 && placeholders.length === 0
      ? "Source-specific"
      : score >= 50
        ? "Needs evidence"
        : "Generic risk";

  return {
    score,
    label,
    findings,
    placeholderCount: placeholders.length,
  };
};
