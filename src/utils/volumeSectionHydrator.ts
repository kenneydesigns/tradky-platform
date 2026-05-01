import { VolumeSection, VolumeSectionKey } from "../types";

type SectionHydrationResult = {
  sections: VolumeSection[];
  matchedKeys: VolumeSectionKey[];
};

type HeadingMatch = {
  key: VolumeSectionKey;
  remainder: string;
};

const sectionKeywordPatterns: Record<VolumeSectionKey, RegExp[]> = {
  problemNeed: [
    /\bproblem\b/i,
    /\bneed\b/i,
    /\bpain point\b/i,
    /\bmission need\b/i,
    /\bsignificance\b/i,
    /\bopportunity\b/i,
    /\bgap\b/i,
  ],
  objectivesSpecificAims: [
    /\bobjectives?\b/i,
    /\bspecific aims?\b/i,
    /\baims?\b/i,
    /\bgoals?\b/i,
    /\bhypothesis\b/i,
    /\btechnical objectives?\b/i,
  ],
  technicalApproach: [
    /\btechnical approach\b/i,
    /\bapproach\b/i,
    /\bmethodology\b/i,
    /\btechnical objective/i,
    /\bproposed solution\b/i,
    /\bfeasibility\b/i,
    /\barchitecture\b/i,
    /\bexperiment\b/i,
  ],
  innovation: [
    /\binnovation\b/i,
    /\bnovel\b/i,
    /\bnovelty\b/i,
    /\bstate of the art\b/i,
    /\bcompetitive advantage\b/i,
    /\bdifferentiator\b/i,
    /\bintellectual property\b/i,
  ],
  workPlan: [
    /\bwork plan\b/i,
    /\bstatement of work\b/i,
    /\bscope of work\b/i,
    /\btask\b/i,
    /\bmilestone\b/i,
    /\bschedule\b/i,
    /\bdeliverable\b/i,
    /\btimeline\b/i,
  ],
  expectedOutcomesDeliverables: [
    /\bexpected outcomes?\b/i,
    /\boutcomes?\b/i,
    /\bdeliverables?\b/i,
    /\boutputs?\b/i,
    /\bprototype\b/i,
    /\breport\b/i,
    /\bdata package\b/i,
  ],
  evaluationMetricsSuccessCriteria: [
    /\bevaluation metrics?\b/i,
    /\bsuccess criteria\b/i,
    /\bmetrics?\b/i,
    /\bthreshold\b/i,
    /\bbaseline\b/i,
    /\bacceptance criteria\b/i,
    /\bmeasure\b/i,
  ],
  relatedWorkPriorRd: [
    /\brelated work\b/i,
    /\bprior r&d\b/i,
    /\bprior research\b/i,
    /\bpreliminary data\b/i,
    /\bbackground\b/i,
    /\bstate of the art\b/i,
    /\bprevious work\b/i,
  ],
  team: [
    /\bteam\b/i,
    /\bkey personnel\b/i,
    /\bprincipal investigator\b/i,
    /\bPI\b/,
    /\bqualification\b/i,
    /\bmanagement\b/i,
    /\badvisor\b/i,
    /\bsubcontractor\b/i,
  ],
  facilitiesEquipmentResources: [
    /\bfacilities?\b/i,
    /\bequipment\b/i,
    /\bresources?\b/i,
    /\blaboratory\b/i,
    /\blab\b/i,
    /\binstrument\b/i,
    /\bcomputing\b/i,
  ],
  commercializationTransition: [
    /\bcommercialization\b/i,
    /\btransition\b/i,
    /\bmarket\b/i,
    /\bcustomer\b/i,
    /\badoption\b/i,
    /\bphase iii\b/i,
    /\bprocurement\b/i,
    /\brevenue\b/i,
  ],
  customerDiscoveryEndUserValidation: [
    /\bcustomer discovery\b/i,
    /\bend user\b/i,
    /\buser validation\b/i,
    /\binterviews?\b/i,
    /\bfeedback\b/i,
    /\bletter of support\b/i,
    /\bpilot\b/i,
  ],
  phaseIToPhaseIITransition: [
    /\bphase i to phase ii\b/i,
    /\bphase 1 to phase 2\b/i,
    /\bphase ii transition\b/i,
    /\bnext phase\b/i,
    /\bfollow-on\b/i,
    /\btransition plan\b/i,
    /\bphase ii plan\b/i,
  ],
  risks: [
    /\brisk\b/i,
    /\bmitigation\b/i,
    /\bdependency\b/i,
    /\bfallback\b/i,
    /\bassumption\b/i,
  ],
  securityComplianceCyber: [
    /\bsecurity\b/i,
    /\bcompliance\b/i,
    /\bcyber\b/i,
    /\bprivacy\b/i,
    /\bregulatory\b/i,
    /\bhuman subjects\b/i,
    /\bcmmc\b/i,
    /\bnist\b/i,
  ],
  dataRightsIpStrategy: [
    /\bdata rights\b/i,
    /\bip\b/i,
    /\bintellectual property\b/i,
    /\bpatent\b/i,
    /\btrade secret\b/i,
    /\blicens/i,
    /\bfreedom to operate\b/i,
  ],
  budgetNarrative: [
    /\bbudget\b/i,
    /\bcost\b/i,
    /\blabor\b/i,
    /\bmaterials\b/i,
    /\btravel\b/i,
    /\bindirect\b/i,
    /\bfee\b/i,
  ],
  referencesCitations: [
    /\breferences?\b/i,
    /\bcitations?\b/i,
    /\bbibliography\b/i,
    /\bdoi\b/i,
    /\bjournal\b/i,
    /\bpublication\b/i,
    /\bsources?\b/i,
  ],
};

const headingClassifiers: Array<{ key: VolumeSectionKey; patterns: RegExp[] }> = [
  {
    key: "referencesCitations",
    patterns: [/\breferences?\b/i, /\bcitations?\b/i, /\bbibliography\b/i, /\bsources?\b/i],
  },
  {
    key: "budgetNarrative",
    patterns: [/\bbudget\b/i, /\bbudget narrative\b/i, /\bcost narrative\b/i, /\bcost proposal\b/i],
  },
  {
    key: "dataRightsIpStrategy",
    patterns: [/\bdata rights\b/i, /\bip strategy\b/i, /\bintellectual property\b/i, /\bpatent strategy\b/i],
  },
  {
    key: "securityComplianceCyber",
    patterns: [/\bsecurity\b/i, /\bcyber\b/i, /\bcompliance\b/i, /\bregulatory\b/i, /\bhuman subjects\b/i],
  },
  {
    key: "risks",
    patterns: [/\brisk/i, /\brisk mitigation\b/i, /\bmitigation plan\b/i],
  },
  {
    key: "phaseIToPhaseIITransition",
    patterns: [/\bphase i to phase ii\b/i, /\bphase ii transition\b/i, /\bphase 1 to phase 2\b/i, /\bnext phase\b/i],
  },
  {
    key: "customerDiscoveryEndUserValidation",
    patterns: [/\bcustomer discovery\b/i, /\bend user validation\b/i, /\bcustomer validation\b/i, /\bend user\b/i],
  },
  {
    key: "commercializationTransition",
    patterns: [
      /\bcommercialization\b/i,
      /\bcommercialization and transition\b/i,
      /\btransition\b/i,
      /\bmarket opportunity\b/i,
      /\bphase iii\b/i,
      /\badoption\b/i,
    ],
  },
  {
    key: "facilitiesEquipmentResources",
    patterns: [/\bfacilities?\b/i, /\bequipment\b/i, /\bresources?\b/i, /\blaborator(y|ies)\b/i],
  },
  {
    key: "relatedWorkPriorRd",
    patterns: [/\brelated work\b/i, /\bprior r&d\b/i, /\bprior research\b/i, /\bpreliminary data\b/i],
  },
  {
    key: "evaluationMetricsSuccessCriteria",
    patterns: [/\bevaluation metrics?\b/i, /\bsuccess criteria\b/i, /\bmetrics?\b/i, /\bacceptance criteria\b/i],
  },
  {
    key: "expectedOutcomesDeliverables",
    patterns: [/\bexpected outcomes?\b/i, /\boutcomes?\b/i, /\bdeliverables?\b/i, /\bexpected results?\b/i],
  },
  {
    key: "workPlan",
    patterns: [
      /\bwork plan\b/i,
      /\bstatement of work\b/i,
      /\bscope of work\b/i,
      /\bproject plan\b/i,
      /\btasks?\b/i,
      /\bmilestones?\b/i,
      /\bschedule\b/i,
      /\bdeliverables?\b/i,
    ],
  },
  {
    key: "team",
    patterns: [
      /\bteam\b/i,
      /\bkey personnel\b/i,
      /\bprincipal investigator\b/i,
      /\bqualifications?\b/i,
      /\bmanagement plan\b/i,
      /\bpartners?\b/i,
    ],
  },
  {
    key: "objectivesSpecificAims",
    patterns: [/\bspecific aims?\b/i, /\bobjectives?\b/i, /\btechnical objectives?\b/i, /\bgoals?\b/i],
  },
  {
    key: "innovation",
    patterns: [
      /\binnovation\b/i,
      /\bnovelty\b/i,
      /\bnovel approach\b/i,
      /\bstate of the art\b/i,
      /\bintellectual property\b/i,
      /\bdifferentiation\b/i,
    ],
  },
  {
    key: "problemNeed",
    patterns: [
      /\bproblem\b/i,
      /\bneed\b/i,
      /\bproblem \/ need\b/i,
      /\bmission need\b/i,
      /\bsignificance of the problem\b/i,
      /\bproblem or opportunity\b/i,
      /\bcustomer need\b/i,
    ],
  },
  {
    key: "technicalApproach",
    patterns: [
      /\btechnical approach\b/i,
      /\btechnical objectives?\b/i,
      /\bobjectives?\b/i,
      /\bmethodology\b/i,
      /\bresearch plan\b/i,
      /\bproposed solution\b/i,
      /\btechnical merit\b/i,
      /\bfeasibility\b/i,
      /\barchitecture\b/i,
    ],
  },
];

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripNumbering = (value: string) =>
  value
    .replace(/^\s*(?:section|part)\s+/i, "")
    .replace(/^\s*(?:[ivxlcdm]+|\d+(?:\.\d+)*|[a-z])[\).\:-]?\s+/i, "")
    .trim();

const isLikelyHeading = (line: string) => {
  const candidate = stripNumbering(line).trim();
  const wordCount = candidate.split(/\s+/).filter(Boolean).length;
  const isTitleLike = /^[A-Z0-9][A-Za-z0-9/&,\-() ]+$/.test(candidate);
  const isAllCaps = candidate.length > 3 && candidate === candidate.toUpperCase();

  return candidate.length <= 120 && wordCount <= 14 && !/[.!?]$/.test(candidate) && (isTitleLike || isAllCaps);
};

const classifyHeading = (value: string): VolumeSectionKey | null => {
  const candidate = stripNumbering(value).replace(/\s+/g, " ").trim();
  if (!candidate || candidate.length > 140) return null;

  const classifier = headingClassifiers.find(({ patterns }) => patterns.some((pattern) => pattern.test(candidate)));
  return classifier?.key ?? null;
};

const matchHeading = (line: string): HeadingMatch | null => {
  const candidate = stripNumbering(line).replace(/[:\u2013\u2014-]\s*$/, "").trim();
  const colonSplit = candidate.match(/^(.{2,90}?)[\:\u2013\u2014-]\s+(.+)$/);
  const headingText = colonSplit?.[1]?.trim() ?? candidate;
  const remainder = colonSplit?.[2]?.trim() ?? "";
  const key = classifyHeading(headingText);

  if (!key || !isLikelyHeading(headingText)) {
    return null;
  }

  return { key, remainder };
};

const scoreParagraph = (paragraph: string, key: VolumeSectionKey) =>
  sectionKeywordPatterns[key].reduce((score, pattern) => score + (pattern.test(paragraph) ? 1 : 0), 0);

const classifyParagraph = (paragraph: string): VolumeSectionKey | null => {
  const scores = Object.keys(sectionKeywordPatterns).map((key) => ({
    key: key as VolumeSectionKey,
    score: scoreParagraph(paragraph, key as VolumeSectionKey),
  }));
  scores.sort((a, b) => b.score - a.score);

  if (!scores[0] || scores[0].score === 0 || scores[0].score === scores[1]?.score) {
    return null;
  }

  return scores[0].key;
};

const extractByHeadings = (text: string) => {
  const buckets = new Map<VolumeSectionKey, string[]>();
  let activeKey: VolumeSectionKey | null = null;

  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = matchHeading(line);
    if (heading) {
      activeKey = heading.key;
      if (heading.remainder) {
        buckets.set(activeKey, [...(buckets.get(activeKey) ?? []), heading.remainder]);
      }
      continue;
    }

    if (isLikelyHeading(line)) {
      activeKey = null;
      continue;
    }

    if (activeKey) {
      buckets.set(activeKey, [...(buckets.get(activeKey) ?? []), line]);
    }
  }

  return buckets;
};

const extractByParagraphKeywords = (text: string) => {
  const buckets = new Map<VolumeSectionKey, string[]>();

  for (const paragraph of text.split(/\n{2,}/).map((block) => normalizeText(block)).filter(Boolean)) {
    if (paragraph.length < 40) continue;

    const key = classifyParagraph(paragraph);
    if (key) {
      buckets.set(key, [...(buckets.get(key) ?? []), paragraph]);
    }
  }

  return buckets;
};

export const prefillSectionsFromTechnicalVolume = (
  sections: VolumeSection[],
  technicalVolumeText: string,
): SectionHydrationResult => {
  const normalized = normalizeText(technicalVolumeText);
  if (!normalized) {
    return { sections, matchedKeys: [] };
  }

  const headingBuckets = extractByHeadings(normalized);
  const keywordBuckets = extractByParagraphKeywords(normalized);
  const mergedBuckets = new Map<VolumeSectionKey, string[]>(headingBuckets.size ? headingBuckets : keywordBuckets);

  if (headingBuckets.size) {
    for (const [key, values] of keywordBuckets) {
      if (!mergedBuckets.has(key)) {
        mergedBuckets.set(key, values);
      }
    }
  }

  const matchedKeys: VolumeSectionKey[] = [];

  const hydratedSections = sections.map((section) => {
    const content = normalizeText((mergedBuckets.get(section.key) ?? []).join("\n\n"));
    if (!content) return section;

    matchedKeys.push(section.key);
    return {
      ...section,
      content,
    };
  });

  return {
    sections: hydratedSections,
    matchedKeys,
  };
};
