import { Project } from "../types";

type ReviewStatus = "Yes" | "No" | "Review";

type CriteriaReviewRow = {
  criteria: string;
  status: ReviewStatus;
  notes: string;
};

type MilestoneReportItem = {
  number: string;
  description: string;
  rdValue: string;
  rating: string;
  recommendations: string;
};

type EvaluationReport = {
  title: string;
  subtitle: string;
  proposalTitle: string;
  topicNumber: string;
  phase: string;
  generatedDate: string;
  overallAssessment: string;
  proposalInfoRows: string[][];
  mandatoryRows: CriteriaReviewRow[];
  mandatoryResult: string;
  additionalRows: CriteriaReviewRow[];
  technicalRows: string[][];
  defenseRows: string[][];
  commercializationRows: string[][];
  transitionRating: string;
  transitionStrengths: string[];
  transitionWeaknesses: string[];
  transitionGaps: string[];
  transitionRecommendations: string[];
  milestoneRows: string[][];
  milestoneItems: MilestoneReportItem[];
  overallRows: string[][];
  overallRating: string;
  selectabilityAssessment: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendedNextSteps: string[];
  finalDecision: string;
  finalDecisionNote: string;
};

const REPORT_FOOTER_TEXT = "AI-assisted draft evaluation. Manual reviewer validation required before submission.";

const REPORT_COLORS = {
  navy: "0B1F33",
  navySoft: "E8EEF5",
  border: "D6DEE8",
  rowAlt: "F7FAFC",
  white: "FFFFFF",
  ink: "18211F",
  muted: "667085",
  excellent: "0E7C3A",
  good: "1D4ED8",
  acceptable: "D9A441",
  marginal: "C86D1B",
  poor: "B42318",
  review: "667085",
  successSoft: "E8F5EC",
  warningSoft: "FFF7DB",
  dangerSoft: "FDECEC",
};

const fileSafe = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "proposal-draft";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const compactText = (value: string) => value.replace(/\s+/g, " ").trim();

const formatDisplayDate = (value: string) => {
  if (!value) return "Not specified";

  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatDisplayDateTime = (value: string) => {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const scoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Acceptable";
  if (score >= 30) return "Marginal";
  return "Poor";
};

const combinedProjectText = (project: Project) =>
  compactText(
    [
      project.solicitationText,
      project.proposalText,
      ...project.sections.map((section) => `${section.title} ${section.content}`),
    ].join(" "),
  );

const containsAny = (text: string, terms: string[]) => {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
};

const extractContext = (text: string, terms: string[]) => {
  const normalized = compactText(text);
  const lower = normalized.toLowerCase();
  const windows: string[] = [];

  terms.forEach((term) => {
    let index = lower.indexOf(term.toLowerCase());
    while (index >= 0) {
      windows.push(normalized.slice(Math.max(0, index - 120), index + term.length + 120));
      index = lower.indexOf(term.toLowerCase(), index + term.length);
    }
  });

  return windows.join(" ");
};

const extractDollarAmounts = (text: string) => {
  const amounts: number[] = [];
  const dollarPattern = /(?:\$|usd\s*)(\d[\d,]*(?:\.\d+)?)\s*(m|mm|million|k|thousand)?/gi;
  let match: RegExpExecArray | null;

  while ((match = dollarPattern.exec(text)) !== null) {
    const amount = Number(match[1].replace(/,/g, ""));
    const unit = match[2]?.toLowerCase();
    if (!Number.isFinite(amount)) continue;

    if (unit === "m" || unit === "mm" || unit === "million") {
      amounts.push(amount * 1_000_000);
    } else if (unit === "k" || unit === "thousand") {
      amounts.push(amount * 1_000);
    } else {
      amounts.push(amount);
    }
  }

  return amounts;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const normalizeRatingLabel = (value: string) => {
  const normalized = compactText(value).toLowerCase();
  if (normalized.includes("excellent")) return "Excellent";
  if (normalized.includes("good")) return "Good";
  if (normalized.includes("acceptable")) return "Acceptable";
  if (normalized.includes("marginal")) return "Marginal";
  if (normalized.includes("poor")) return "Poor";
  if (normalized.includes("yes")) return "Yes";
  if (normalized.includes("no")) return "No";
  return normalized.includes("review") ? "Review Required" : value || "Review Required";
};

const displayStatus = (status: ReviewStatus | string) =>
  status === "Review" ? "Review Required" : normalizeRatingLabel(status);

const ratingFill = (value: string) => {
  const normalized = normalizeRatingLabel(value);
  if (normalized === "Excellent" || normalized === "Yes") return REPORT_COLORS.excellent;
  if (normalized === "Good") return REPORT_COLORS.good;
  if (normalized === "Acceptable") return REPORT_COLORS.acceptable;
  if (normalized === "Marginal") return REPORT_COLORS.marginal;
  if (normalized === "Poor" || normalized === "No") return REPORT_COLORS.poor;
  return REPORT_COLORS.review;
};

const ratingTextColor = (value: string) => {
  const normalized = normalizeRatingLabel(value);
  return normalized === "Acceptable" ? REPORT_COLORS.ink : REPORT_COLORS.white;
};

const takeTop = (items: string[], count: number, fallback: string) => {
  const values = items.map(cleanEvaluatorText).filter(Boolean);
  return values.length ? values.slice(0, count) : [fallback];
};

const cleanEvaluatorText = (value: string | undefined) => {
  if (!value) return "";

  return compactText(value)
    .replace(/^Mock DAF\/AFWERX\s+(.+?)\s+rating based on\s+/i, "Evaluator assessment considers ")
    .replace(/^Mock assessment of whether\s+/i, "Assessment checks whether ")
    .replace(/^Mock assessment of\s+/i, "Assessment of ")
    .replace(/\bMock DAF\/AFWERX\b/gi, "DAF/AFWERX")
    .replace(/\bMock assessment\b/gi, "Assessment")
    .replace(/\s+/g, " ")
    .trim();
};

const inferBudgetStatus = (text: string): CriteriaReviewRow => {
  const budgetContext = extractContext(text, ["budget", "cost", "price", "total", "sbir"]);
  const amounts = extractDollarAmounts(budgetContext);

  if (!amounts.length) {
    return {
      criteria: "SBIR Cost <= $1.25M",
      status: "Review",
      notes: "No explicit SBIR budget total was extracted from the proposal text.",
    };
  }

  const largestAmount = Math.max(...amounts);
  return {
    criteria: "SBIR Cost <= $1.25M",
    status: largestAmount <= 1_250_000 ? "Yes" : "No",
    notes: `Largest budget-context amount extracted: ${formatMoney(largestAmount)}.`,
  };
};

const inferPeriodStatus = (text: string): CriteriaReviewRow => {
  const periodContext = extractContext(text, ["period of performance", "performance period", "pop", "months", "month"]);
  const matches = [...periodContext.matchAll(/(\d+(?:\.\d+)?)\s*(months?|mos?\b|years?|yrs?\b)/gi)];
  const periods = matches
    .map((match) => {
      const value = Number(match[1]);
      if (!Number.isFinite(value)) return null;
      return /^y/i.test(match[2]) ? value * 12 : value;
    })
    .filter((value): value is number => value !== null);

  if (!periods.length) {
    return {
      criteria: "Period of Performance <= 21 months",
      status: "Review",
      notes: "No explicit period of performance was extracted from the proposal text.",
    };
  }

  const longestPeriod = Math.max(...periods);
  return {
    criteria: "Period of Performance <= 21 months",
    status: longestPeriod <= 21 ? "Yes" : "No",
    notes: `Longest extracted period: ${Math.round(longestPeriod)} months.`,
  };
};

const inferCustomerMemoStatus = (text: string): CriteriaReviewRow => {
  const negative = /(no|without|missing|absent|not included|not signed).{0,50}(customer memorandum|customer memo|\bcm\b)|(customer memorandum|customer memo|\bcm\b).{0,50}(missing|absent|not included|not signed)/i.test(
    text,
  );
  const positive =
    /(customer memorandum|customer memo|\bcm\b)/i.test(text) && /(signed|signature|included|attached|attachment|memo)/i.test(text);

  return {
    criteria: "Customer Memorandum (signed) included",
    status: negative ? "No" : positive ? "Yes" : "Review",
    notes: negative
      ? "Text appears to indicate a missing or unsigned Customer Memorandum."
      : positive
        ? "Customer Memorandum evidence was detected; confirm signatures manually."
        : "Customer Memorandum evidence was not clearly extracted.",
  };
};

const inferTechnicalVolumePageStatus = (text: string): CriteriaReviewRow => {
  const patterns = [
    /technical volume.{0,60}?(\d{1,3})\s*pages?/i,
    /(\d{1,3})\s*pages?.{0,60}?technical volume/i,
  ];
  const pageCount = patterns
    .map((pattern) => pattern.exec(text)?.[1])
    .filter(Boolean)
    .map(Number)
    .find((value) => Number.isFinite(value));

  if (!pageCount) {
    return {
      criteria: "Technical Volume <= 15 pages",
      status: "Review",
      notes: "Page count was not extracted. Uploaded plain text does not preserve reliable PDF page counts.",
    };
  }

  return {
    criteria: "Technical Volume <= 15 pages",
    status: pageCount <= 15 ? "Yes" : "No",
    notes: `Extracted technical volume page count: ${pageCount}.`,
  };
};

const inferRegulatoryComplianceStatus = (text: string): CriteriaReviewRow => {
  const negative = /(no|without|missing|absent|not included).{0,50}(regulatory compliance|compliance form)|(regulatory compliance|compliance form).{0,50}(missing|absent|not included)/i.test(
    text,
  );
  const positive = /(regulatory compliance form|regulatory compliance|compliance form)/i.test(text);

  return {
    criteria: "Regulatory Compliance Form included",
    status: negative ? "No" : positive ? "Yes" : "Review",
    notes: negative
      ? "Text appears to indicate the compliance form is missing."
      : positive
        ? "Regulatory compliance form evidence was detected; confirm attachment manually."
        : "Regulatory compliance form evidence was not clearly extracted.",
  };
};

const buildMandatoryRows = (project: Project) => {
  const text = combinedProjectText(project);
  return [
    inferBudgetStatus(text),
    inferPeriodStatus(text),
    inferCustomerMemoStatus(text),
    inferTechnicalVolumePageStatus(text),
    inferRegulatoryComplianceStatus(text),
  ];
};

const evidenceStatus = (criteria: string, isPresent: boolean, presentNote: string, missingNote: string): CriteriaReviewRow => ({
  criteria,
  status: isPresent ? "Yes" : "Review",
  notes: isPresent ? presentNote : missingNote,
});

const buildAdditionalRows = (project: Project): CriteriaReviewRow[] => {
  const text = combinedProjectText(project);
  const hasDefense = containsAny(text, ["defense", "air force", "space force", "warfighter", "mission", "operational"]);
  const hasCommercial = containsAny(text, ["commercial", "market", "revenue", "customer", "sales", "private sector"]);

  return [
    evidenceStatus(
      "Proposal aligned to Open Topic requirements",
      containsAny(text, ["open topic", "afwerx", "AFX"]) || Boolean(project.topicId.trim()),
      "Open Topic or topic-number evidence was detected.",
      "Confirm alignment to the Open Topic requirements.",
    ),
    evidenceStatus(
      "Feasibility evidence provided (Phase I equivalent)",
      containsAny(text, ["phase i equivalent", "feasibility", "prototype", "pilot", "test result", "trl", "demonstrated"]),
      "Feasibility, prototype, test, pilot, or TRL evidence was detected.",
      "Add Phase I equivalent feasibility evidence.",
    ),
    evidenceStatus(
      "Dual-use (commercial + defense) clearly articulated",
      hasDefense && hasCommercial,
      "Both defense and commercial signals were detected.",
      "Clarify the commercial and defense paths as a dual-use story.",
    ),
    evidenceStatus(
      "IP ownership / rights clearly defined",
      containsAny(text, ["intellectual property", " ip ", "data rights", "ownership", "patent", "license"]),
      "IP, data rights, ownership, patent, or licensing language was detected.",
      "Define IP ownership, data rights, and licensing posture.",
    ),
    evidenceStatus(
      "Foreign ownership disclosures completed",
      containsAny(text, ["foreign ownership", "foci", "beneficial owner", "foreign influence", "disclosure"]),
      "Foreign ownership, FOCI, beneficial-owner, or disclosure language was detected.",
      "Confirm required foreign ownership disclosures.",
    ),
    evidenceStatus(
      "Security risk acceptable (FOCI, supply chain, etc.)",
      containsAny(text, ["supply chain", "security risk", "foci", "cybersecurity", "risk mitigation", "secure"]),
      "Security, FOCI, supply-chain, or mitigation language was detected.",
      "Assess FOCI, supply-chain, cyber, and related security risk.",
    ),
  ];
};

const getRubricScore = (project: Project, key: "commercialization" | "defenseNeed" | "technicalMerit") =>
  project.evaluation?.rubricScores?.find((score) => score.key === key);

const listItem = (items: string[] | undefined, index: number, fallback: string) => items?.[index] ?? fallback;

const rowEvidence = (rationale: string | undefined, detail: string | undefined) =>
  [cleanEvaluatorText(rationale), cleanEvaluatorText(detail)].filter(Boolean).join(" ");

const rowImprovement = (items: string[] | undefined, index: number, fallback: string) =>
  cleanEvaluatorText(listItem(items, index, fallback));

const buildRubricReviewRows = (project: Project) => {
  const evaluation = project.evaluation;
  const technical = getRubricScore(project, "technicalMerit");
  const defense = getRubricScore(project, "defenseNeed");
  const commercial = getRubricScore(project, "commercialization");
  const technicalRating = technical?.label ?? scoreLabel(evaluation?.readinessScore ?? 0);
  const defenseRating = defense?.label ?? scoreLabel(evaluation?.readinessScore ?? 0);
  const commercialRating = commercial?.label ?? scoreLabel(evaluation?.readinessScore ?? 0);

  return {
    technicalRows: [
      [
        "C1. Problem & Use Case Framing",
        technicalRating,
        rowEvidence(technical?.rationale, listItem(technical?.strengths, 0, "Problem and use-case evidence requires reviewer validation.")),
        rowImprovement(evaluation?.technicalMerit, 0, "Define the operational problem, end users, and use cases earlier."),
      ],
      [
        "C2. Technical Approach Soundness & Merit",
        technicalRating,
        rowEvidence(technical?.rationale, listItem(technical?.strengths, 1, "Technical approach evidence requires reviewer validation.")),
        rowImprovement(evaluation?.technicalMerit, 1, "Add architecture, tasks, test methods, and performance thresholds."),
      ],
      [
        "C3. Level of Technical Risk",
        technicalRating,
        rowEvidence(technical?.rationale, listItem(technical?.gaps, 0, "Risk evidence requires reviewer validation.")),
        rowImprovement(evaluation?.technicalMerit, 2, "Tie risks to mitigations, decision gates, and residual-risk handling."),
      ],
      [
        "C4. Innovation / Differentiation",
        technicalRating,
        rowEvidence(technical?.rationale, listItem(technical?.gaps, 1, "Innovation evidence requires reviewer validation.")),
        "Compare the solution against alternatives and the current state of the art.",
      ],
      [
        "C5. Team Qualifications",
        technicalRating,
        rowEvidence(technical?.rationale, listItem(technical?.gaps, 2, "Team qualification evidence requires reviewer validation.")),
        "Map named team experience, facilities, and prior R&D execution to the work plan.",
      ],
    ],
    defenseRows: [
      [
        "C1. Mission Impact & Urgency",
        defenseRating,
        rowEvidence(defense?.rationale, listItem(defense?.strengths, 0, "Mission-impact evidence requires reviewer validation.")),
        rowImprovement(evaluation?.transitionPotential, 0, "Quantify the immediate operational consequence and capability gap."),
      ],
      [
        "C2. Breadth of Applicability",
        defenseRating,
        rowEvidence(defense?.rationale, listItem(defense?.gaps, 0, "Breadth evidence requires reviewer validation.")),
        rowImprovement(evaluation?.transitionPotential, 1, "Name affected units, bases, platforms, MAJCOMs, or Field Commands."),
      ],
      [
        "C3. Specificity of Defense Need",
        defenseRating,
        rowEvidence(defense?.rationale, listItem(defense?.strengths, 1, "Specific use-case evidence requires reviewer validation.")),
        "Tie the solution to a specific defense customer, user workflow, and measurable mission outcome.",
      ],
      [
        "C4. Customer Memorandum Strength",
        defenseRating,
        rowEvidence(defense?.rationale, buildMandatoryRows(project)[2].notes),
        "Strengthen CM signatures, alignment to proposal milestones, customer role, and funding path.",
      ],
    ],
    commercializationRows: [
      [
        "C1. Market Size & Revenue Potential",
        commercialRating,
        rowEvidence(commercial?.rationale, listItem(commercial?.strengths, 0, "Market evidence requires reviewer validation.")),
        rowImprovement(evaluation?.commercialization, 0, "Quantify TAM/SAM/SOM, buyer urgency, pricing, and revenue potential."),
      ],
      [
        "C2. Business Model & Plan",
        commercialRating,
        rowEvidence(commercial?.rationale, listItem(commercial?.gaps, 0, "Business-plan evidence requires reviewer validation.")),
        rowImprovement(evaluation?.commercialization, 1, "Clarify the path to revenue capture and commercial viability."),
      ],
      [
        "C3. Defense & Private Sector Interest",
        commercialRating,
        rowEvidence(commercial?.rationale, listItem(commercial?.strengths, 1, "Customer-interest evidence requires reviewer validation.")),
        "Add LOIs, pilots, revenue, partner commitments, investor interest, or defense funding evidence.",
      ],
      [
        "C4. Funding Commitments / Traction",
        commercialRating,
        rowEvidence(commercial?.rationale, listItem(commercial?.gaps, 1, "Traction evidence requires reviewer validation.")),
        "Document committed non-SBIR funds, pilots, paying users, revenue, or signed transition support.",
      ],
    ],
  };
};

const buildMilestoneRows = (project: Project) => {
  const workPlan = project.sections.find((section) => section.key === "workPlan")?.content || project.proposalText;
  const milestoneLines = workPlan
    .split(/\n+/)
    .map((line) => line.replace(/^[-*#\d.\s]+/, "").trim())
    .filter((line) => /(milestone|task|month|deliverable|objective|prototype|test|demo|validation)/i.test(line))
    .slice(0, 5);

  if (!milestoneLines.length) {
    return [
      [
        "1",
        "Milestone details not extracted",
        "Review required",
        "Review Required",
        "Define measurable, time-bound R&D milestones that reduce technical risk.",
      ],
    ];
  }

  return milestoneLines.map((line, index) => [
    String(index + 1),
    cleanEvaluatorText(line),
    "Assess whether this reduces technical risk and produces measurable evidence.",
    "Review Required",
    "Add objective success criteria, acceptance thresholds, dates, and deliverables.",
  ]);
};

const buildMilestoneItems = (rows: string[][]): MilestoneReportItem[] =>
  rows.map(([number, description, rdValue, rating, recommendations]) => ({
    number: number || "1",
    description: cleanEvaluatorText(description || "Milestone details not extracted"),
    rdValue: cleanEvaluatorText(rdValue || "Review required"),
    rating: normalizeRatingLabel(rating || "Review Required"),
    recommendations: cleanEvaluatorText(recommendations || "Add objective success criteria, acceptance thresholds, dates, and deliverables."),
  }));

const buildOverallAssessment = (
  readinessScore: number,
  overallRating: string,
  selectabilityAssessment: string,
  finalDecision: string,
  hasManualMandatoryChecks: boolean,
) =>
  [
    `Overall rating is ${overallRating} with a readiness score of ${readinessScore}/100.`,
    `Selectability is assessed as ${selectabilityAssessment}; final decision: ${finalDecision}.`,
    hasManualMandatoryChecks ? "Mandatory compliance items still require manual reviewer validation." : "",
  ]
    .filter(Boolean)
    .join(" ");

const buildEvaluationReport = (project: Project): EvaluationReport => {
  const evaluation = project.evaluation;
  if (!evaluation) {
    throw new Error("Run an evaluation before downloading a report.");
  }

  const mandatoryRows = buildMandatoryRows(project);
  const hasDisqualifier = mandatoryRows.some((row) => row.status === "No");
  const hasManualMandatoryChecks = mandatoryRows.some((row) => row.status === "Review");
  const mandatoryResult = hasDisqualifier
    ? "DISQUALIFIED - one or more mandatory criteria appear to be unmet."
    : hasManualMandatoryChecks
      ? "Manual verification required before auto-disqualification can be cleared."
      : "Proceed to full evaluation - all mandatory criteria were detected as satisfied.";
  const { technicalRows, defenseRows, commercializationRows } = buildRubricReviewRows(project);
  const technical = getRubricScore(project, "technicalMerit");
  const defense = getRubricScore(project, "defenseNeed");
  const commercial = getRubricScore(project, "commercialization");
  const overallRating = scoreLabel(evaluation.readinessScore);
  const selectabilityAssessment = hasDisqualifier
    ? "Not Selectable"
    : evaluation.readinessScore >= 85 && !hasManualMandatoryChecks
      ? "Highly Selectable"
      : evaluation.readinessScore >= 50
        ? "Selectable with Revisions"
        : "Not Selectable";
  const finalDecision = hasDisqualifier || evaluation.readinessScore < 50
    ? "Do Not Recommend"
    : evaluation.readinessScore >= 85 && !hasManualMandatoryChecks
      ? "Recommend for Award"
      : "Recommend with Revisions";
  const proposalTitle = project.name || "Not specified";
  const topicNumber = project.topicId || "Not specified";
  const phase = /direct/i.test(project.phase) ? "Direct-to-Phase II (D2P2)" : project.phase || "Not specified";
  const generatedDate = formatDisplayDateTime(evaluation.generatedAt);
  const milestoneRows = buildMilestoneRows(project);
  const keyStrengths = evaluation.strengths.map(cleanEvaluatorText).filter(Boolean);
  const keyWeaknesses = evaluation.weaknesses.map(cleanEvaluatorText).filter(Boolean);
  const recommendedNextSteps = [
    "Strengthen Customer Memorandum if weak.",
    "Improve commercialization evidence: traction, revenue, LOIs, pilots, and funding commitments.",
    "Clarify technical risk mitigation.",
    "Align more explicitly to DoD critical technology priorities.",
    "Refine milestone plan to emphasize R&D outcomes.",
    ...evaluation.rewriteActions.slice(0, 3).map(cleanEvaluatorText),
  ];

  return {
    title: "AFWERX SBIR/STTR D2P2 Proposal Evaluation Report",
    subtitle: "Aligned with AFX25.5 Release 8 + Amendment 1, DoD 25.4 SBIR BAA, and AFWERX criteria.",
    proposalTitle,
    topicNumber,
    phase,
    generatedDate,
    overallAssessment: buildOverallAssessment(
      evaluation.readinessScore,
      overallRating,
      selectabilityAssessment,
      finalDecision,
      hasManualMandatoryChecks,
    ),
    proposalInfoRows: [
      ["Company Name", "Not specified"],
      ["Proposal Title", proposalTitle],
      ["Topic Number", topicNumber],
      ["Phase", phase],
      [
        "Submission Date",
        project.dueDate ? `Not specified (project due date: ${formatDisplayDate(project.dueDate)})` : "Not specified",
      ],
      ["Evaluator", "AI-assisted DAF/AFWERX proposal evaluator"],
      ["Evaluation Generated", generatedDate],
    ],
    mandatoryRows,
    mandatoryResult,
    additionalRows: buildAdditionalRows(project),
    technicalRows,
    defenseRows,
    commercializationRows,
    transitionRating: defense?.label ?? overallRating,
    transitionStrengths: takeTop(defense?.strengths?.length ? defense.strengths : evaluation.transitionPotential, 3, "Transition strengths require validation."),
    transitionWeaknesses: takeTop(defense?.gaps?.length ? defense.gaps : evaluation.weaknesses, 3, "Transition weaknesses require validation."),
    transitionGaps: takeTop(evaluation.complianceGaps, 3, "DoD roadmap gaps require validation."),
    transitionRecommendations: [
      "Strengthen transition partner commitments.",
      "Define acquisition pathway earlier.",
      "Map technology to specific DoD programs.",
      ...evaluation.transitionPotential.slice(0, 2).map(cleanEvaluatorText),
    ],
    milestoneRows,
    milestoneItems: buildMilestoneItems(milestoneRows),
    overallRows: [
      ["Technical Merit", technical?.label ?? overallRating],
      ["Defense Need", defense?.label ?? overallRating],
      ["Commercialization", commercial?.label ?? overallRating],
      ["Transition Feasibility", defense?.label ?? overallRating],
      ["Readiness Score", `${evaluation.readinessScore}/100`],
    ],
    overallRating,
    selectabilityAssessment,
    keyStrengths: keyStrengths.length ? keyStrengths : ["No major strengths were identified."],
    keyWeaknesses: keyWeaknesses.length ? keyWeaknesses : ["No major weaknesses were identified."],
    recommendedNextSteps,
    finalDecision,
    finalDecisionNote: hasManualMandatoryChecks
      ? "Decision is conditional on manual verification of mandatory compliance items."
      : "Decision reflects the current evaluator score and extracted compliance evidence.",
  };
};

const markdownTable = (headers: string[], rows: string[][]) => {
  const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => escapeCell(cell || " ")).join(" | ")} |`),
  ].join("\n");
};

const criteriaRowsToTableRows = (rows: CriteriaReviewRow[]) =>
  rows.map((row) => [row.criteria, displayStatus(row.status), cleanEvaluatorText(row.notes)]);

const markdownList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

export const buildEvaluationReportMarkdown = (project: Project) => {
  const report = buildEvaluationReport(project);

  return [
    `# ${report.title}`,
    "",
    report.subtitle,
    "",
    "## Proposal Information",
    "",
    markdownTable(["Field", "Value"], report.proposalInfoRows),
    "",
    "## 1. Mandatory Criteria Review (Auto-Disqualification)",
    "",
    markdownTable(["Mandatory Criteria", "Yes/No", "Notes"], criteriaRowsToTableRows(report.mandatoryRows)),
    "",
    `**Result:** ${report.mandatoryResult}`,
    "",
    "## 2. Additional Compliance Criteria",
    "",
    markdownTable(["Additional Criteria", "Yes/No", "Assessment Notes"], criteriaRowsToTableRows(report.additionalRows)),
    "",
    "## 3. Technical Merit Review",
    "",
    "**Rating Scale:** Excellent / Good / Acceptable / Marginal / Poor",
    "",
    markdownTable(
      ["Criteria", "Rating", "Justification (cite proposal sections/pages)", "How to Improve to Excellent"],
      report.technicalRows,
    ),
    "",
    "## 4. Defense Need Review",
    "",
    markdownTable(
      ["Criteria", "Rating", "Justification (cite proposal)", "How to Improve to Excellent"],
      report.defenseRows,
    ),
    "",
    "## 5. Commercialization Review",
    "",
    markdownTable(["Criteria", "Rating", "Justification", "How to Improve to Excellent"], report.commercializationRows),
    "",
    "## 6. Transition Plan Assessment",
    "",
    `**Rating:** ${report.transitionRating}`,
    "",
    "### Assessment Areas",
    "",
    markdownList([
      "Alignment with DoD Critical Technology Areas",
      "Integration with acquisition pathways (e.g., STRATFI/TACFI)",
      "Feasibility of transition to Program of Record",
      "Stakeholder engagement and funding strategy",
    ]),
    "",
    "### Analysis",
    "",
    "**Strengths:**",
    markdownList(report.transitionStrengths),
    "",
    "**Weaknesses:**",
    markdownList(report.transitionWeaknesses),
    "",
    "**Gaps vs DoD roadmaps:**",
    markdownList(report.transitionGaps),
    "",
    "### Recommendations",
    "",
    markdownList(report.transitionRecommendations),
    "",
    "## 7. Milestone Assessment",
    "",
    markdownTable(
      ["Milestone #", "Description", "R&D Value", "Rating", "Improvement Recommendations"],
      report.milestoneRows,
    ),
    "",
    "## 8. Summary and Overall Rating",
    "",
    markdownTable(["Overall Assessment", "Rating"], report.overallRows),
    "",
    `**Overall Rating:** ${report.overallRating}`,
    "",
    `**Selectability Assessment:** ${report.selectabilityAssessment}`,
    "",
    "## 9. Key Strengths",
    "",
    markdownList(report.keyStrengths),
    "",
    "## 10. Key Weaknesses / Risks",
    "",
    markdownList(report.keyWeaknesses),
    "",
    "## 11. Recommended Next Steps",
    "",
    markdownList(report.recommendedNextSteps),
    "",
    "## 12. Final Recommendation",
    "",
    `**Decision:** ${report.finalDecision}`,
    "",
    report.finalDecisionNote,
    "",
  ].join("\n");
};

export const exportEvaluationReportMarkdown = (project: Project) => {
  const blob = new Blob([buildEvaluationReportMarkdown(project)], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${fileSafe(project.name)}-evaluation-report.md`);
};

export const buildMarkdown = (project: Project) => {
  const metadata = [
    `# ${project.name}`,
    "",
    `- Agency: ${project.agency}`,
    `- Program: ${project.program}`,
    `- Topic ID: ${project.topicId || "Not specified"}`,
    `- Phase: ${project.phase}`,
    project.dueDate ? `- Due date: ${project.dueDate}` : "",
  ].filter(Boolean);

  const sections = project.sections.flatMap((section) => [
    "",
    `## ${section.title}`,
    "",
    section.content.trim() || "_Draft content pending._",
  ]);

  return [...metadata, ...sections, ""].join("\n");
};

export const exportMarkdown = (project: Project) => {
  const blob = new Blob([buildMarkdown(project)], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${fileSafe(project.name)}.md`);
};

export const exportDocx = async (project: Project) => {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");

  const children = [
    new Paragraph({
      text: project.name,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Agency: ${project.agency}`, break: 1 }),
        new TextRun({ text: `Program: ${project.program}`, break: 1 }),
        new TextRun({ text: `Topic ID: ${project.topicId || "Not specified"}`, break: 1 }),
        new TextRun({ text: `Phase: ${project.phase}`, break: 1 }),
        new TextRun({ text: project.dueDate ? `Due date: ${project.dueDate}` : "Due date: Not specified", break: 1 }),
      ],
    }),
    ...project.sections.flatMap((section) => [
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
      }),
      ...section.content
        .split(/\n{2,}/)
        .map(
          (paragraph) =>
            new Paragraph({
              text: paragraph.trim() || "Draft content pending.",
            }),
        ),
    ]),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileSafe(project.name)}.docx`);
};

export const exportEvaluationReportDocx = async (project: Project) => {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlignTable,
    WidthType,
  } = await import("docx");
  const report = buildEvaluationReport(project);
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
    left: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
    right: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: REPORT_COLORS.border },
  };

  type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];
  type DocxHeading = (typeof HeadingLevel)[keyof typeof HeadingLevel];

  const paragraph = (
    text: string,
    options: {
      bold?: boolean;
      color?: string;
      size?: number;
      alignment?: DocxAlignment;
      spacingAfter?: number;
      pageBreakBefore?: boolean;
    } = {},
  ) =>
    new Paragraph({
      alignment: options.alignment,
      pageBreakBefore: options.pageBreakBefore,
      children: [
        new TextRun({
          text: cleanEvaluatorText(text) || " ",
          bold: options.bold,
          color: options.color ?? REPORT_COLORS.ink,
          size: options.size ?? 20,
        }),
      ],
      spacing: { after: options.spacingAfter ?? 120 },
    });

  const heading = (text: string, level: DocxHeading = HeadingLevel.HEADING_2, pageBreakBefore = false) =>
    new Paragraph({
      heading: level,
      pageBreakBefore,
      children: [
        new TextRun({
          text,
          bold: true,
          color: level === HeadingLevel.HEADING_1 ? REPORT_COLORS.navy : REPORT_COLORS.ink,
        }),
      ],
      spacing: { before: pageBreakBefore ? 0 : 300, after: 140 },
    });

  const spacer = (height = 180) => new Paragraph({ text: "", spacing: { after: height } });

  const bulletList = (items: string[]) => items.map((item) => paragraph(`- ${item}`, { spacingAfter: 80 }));

  const tableCell = (
    text: string,
    options: {
      isHeader?: boolean;
      fill?: string;
      color?: string;
      bold?: boolean;
      alignment?: DocxAlignment;
      width?: number;
      size?: number;
      columnSpan?: number;
    } = {},
  ) =>
    new TableCell({
      children: [
        paragraph(text || " ", {
          bold: options.bold ?? options.isHeader,
          color: options.color ?? (options.isHeader ? REPORT_COLORS.white : REPORT_COLORS.ink),
          alignment: options.alignment,
          size: options.size,
          spacingAfter: 0,
        }),
      ],
      margins: {
        top: 150,
        bottom: 150,
        left: 150,
        right: 150,
      },
      verticalAlign: VerticalAlignTable.TOP,
      width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
      columnSpan: options.columnSpan,
      shading: options.isHeader || options.fill ? { fill: options.fill ?? REPORT_COLORS.navy } : undefined,
    });

  const ratingCell = (value: string, width?: number) =>
    tableCell(displayStatus(value), {
      fill: ratingFill(value),
      color: ratingTextColor(value),
      bold: true,
      alignment: AlignmentType.CENTER,
      width,
    });

  const docxTable = (
    headers: string[],
    rows: string[][],
    options: {
      widths?: number[];
      centerColumns?: number[];
      ratingColumns?: number[];
    } = {},
  ) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
      borders: tableBorders,
      rows: [
        new TableRow({
          children: headers.map((header, index) =>
            tableCell(header, {
              isHeader: true,
              alignment: options.centerColumns?.includes(index) ? AlignmentType.CENTER : AlignmentType.LEFT,
              width: options.widths?.[index],
            }),
          ),
        }),
        ...rows.map(
          (row, rowIndex) =>
            new TableRow({
              children: row.map((cell, columnIndex) => {
                const width = options.widths?.[columnIndex];
                if (options.ratingColumns?.includes(columnIndex)) {
                  return ratingCell(cell, width);
                }

                return tableCell(cell, {
                  fill: rowIndex % 2 === 1 ? REPORT_COLORS.rowAlt : undefined,
                  alignment: options.centerColumns?.includes(columnIndex) ? AlignmentType.CENTER : AlignmentType.LEFT,
                  width,
                });
              }),
            }),
        ),
      ],
    });

  const sectionTable = (
    title: string,
    headers: string[],
    rows: string[][],
    options: {
      widths?: number[];
      centerColumns?: number[];
      ratingColumns?: number[];
      pageBreakBefore?: boolean;
    } = {},
  ) => [
    heading(title, HeadingLevel.HEADING_2, options.pageBreakBefore),
    docxTable(headers, rows, {
      widths: options.widths,
      centerColumns: options.centerColumns,
      ratingColumns: options.ratingColumns,
    }),
    spacer(220),
  ];

  const scoreBadge = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: ratingFill(report.overallRating) },
            margins: { top: 260, bottom: 260, left: 180, right: 180 },
            verticalAlign: VerticalAlignTable.CENTER,
            children: [
              paragraph(`${project.evaluation?.readinessScore ?? 0}`, {
                bold: true,
                color: ratingTextColor(report.overallRating),
                size: 54,
                alignment: AlignmentType.CENTER,
                spacingAfter: 20,
              }),
              paragraph("Readiness Score", {
                bold: true,
                color: ratingTextColor(report.overallRating),
                size: 18,
                alignment: AlignmentType.CENTER,
                spacingAfter: 20,
              }),
              paragraph(report.overallRating, {
                bold: true,
                color: ratingTextColor(report.overallRating),
                size: 22,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const coverHeader = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
      bottom: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
      left: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
      right: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: REPORT_COLORS.white },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 220 },
            verticalAlign: VerticalAlignTable.TOP,
            children: [
              heading(report.title, HeadingLevel.HEADING_1),
              paragraph(report.subtitle, { color: REPORT_COLORS.muted, size: 19 }),
              paragraph(`Proposal Title: ${report.proposalTitle}`, { bold: true, size: 22 }),
              paragraph(`Topic Number: ${report.topicNumber}`),
              paragraph(`Phase: ${report.phase}`),
              paragraph(`Generated: ${report.generatedDate}`),
              paragraph(`Overall Rating: ${report.overallRating}`, { bold: true }),
            ],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            verticalAlign: VerticalAlignTable.TOP,
            children: [scoreBadge],
          }),
        ],
      }),
    ],
  });

  const summaryColumns = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: [
      new TableRow({
        children: ["Top 3 Strengths", "Top 3 Weaknesses", "Top 3 Next Actions"].map((header) =>
          tableCell(header, {
            isHeader: true,
            alignment: AlignmentType.CENTER,
            width: 33,
          }),
        ),
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 140, right: 140 },
            verticalAlign: VerticalAlignTable.TOP,
            children: bulletList(takeTop(report.keyStrengths, 3, "No major strengths were identified.")),
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 140, right: 140 },
            verticalAlign: VerticalAlignTable.TOP,
            children: bulletList(takeTop(report.keyWeaknesses, 3, "No major weaknesses were identified.")),
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 140, right: 140 },
            verticalAlign: VerticalAlignTable.TOP,
            children: bulletList(takeTop(report.recommendedNextSteps, 3, "Validate mandatory compliance items.")),
          }),
        ],
      }),
    ],
  });

  const executiveSummary = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: REPORT_COLORS.navySoft },
            margins: { top: 220, bottom: 220, left: 220, right: 220 },
            verticalAlign: VerticalAlignTable.TOP,
            children: [
              heading("Executive Summary", HeadingLevel.HEADING_2),
              paragraph(report.overallAssessment),
              paragraph(`Selectability Recommendation: ${report.selectabilityAssessment}`, { bold: true }),
              summaryColumns,
            ],
          }),
        ],
      }),
    ],
  });

  const milestoneCard = (milestone: MilestoneReportItem) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: tableBorders,
      rows: [
        new TableRow({
          children: [
            tableCell(`Milestone ${milestone.number}`, {
              isHeader: true,
              width: 100,
              columnSpan: 2,
            }),
          ],
        }),
        new TableRow({
          children: [tableCell("Description", { bold: true, width: 24, fill: REPORT_COLORS.rowAlt }), tableCell(milestone.description, { width: 76 })],
        }),
        new TableRow({
          children: [tableCell("R&D Value", { bold: true, width: 24, fill: REPORT_COLORS.rowAlt }), tableCell(milestone.rdValue, { width: 76 })],
        }),
        new TableRow({
          children: [tableCell("Rating", { bold: true, width: 24, fill: REPORT_COLORS.rowAlt }), ratingCell(milestone.rating, 76)],
        }),
        new TableRow({
          children: [
            tableCell("Improvement Recommendations", { bold: true, width: 24, fill: REPORT_COLORS.rowAlt }),
            tableCell(milestone.recommendations, { width: 76 }),
          ],
        }),
      ],
    });

  const children = [
    coverHeader,
    spacer(220),
    executiveSummary,
    ...sectionTable("Proposal Information", ["Field", "Value"], report.proposalInfoRows, { widths: [32, 68] }),
    ...sectionTable("Mandatory Criteria Review", ["Mandatory Criteria", "Status", "Notes"], criteriaRowsToTableRows(report.mandatoryRows), {
      widths: [40, 18, 42],
      centerColumns: [1],
      ratingColumns: [1],
    }),
    paragraph(`Result: ${report.mandatoryResult}`, { bold: true }),
    ...sectionTable("Additional Compliance Criteria", ["Additional Criteria", "Status", "Assessment Notes"], criteriaRowsToTableRows(report.additionalRows), {
      widths: [40, 18, 42],
      centerColumns: [1],
      ratingColumns: [1],
    }),
    ...sectionTable(
      "Technical Merit Review",
      ["Criteria", "Rating", "Evaluator Justification", "How to Improve to Excellent"],
      report.technicalRows,
      {
        widths: [24, 15, 32, 29],
        centerColumns: [1],
        ratingColumns: [1],
        pageBreakBefore: true,
      },
    ),
    ...sectionTable(
      "Defense Need Review",
      ["Criteria", "Rating", "Evaluator Justification", "How to Improve to Excellent"],
      report.defenseRows,
      {
        widths: [24, 15, 32, 29],
        centerColumns: [1],
        ratingColumns: [1],
        pageBreakBefore: true,
      },
    ),
    ...sectionTable(
      "Commercialization Review",
      ["Criteria", "Rating", "Evaluator Justification", "How to Improve to Excellent"],
      report.commercializationRows,
      {
        widths: [24, 15, 32, 29],
        centerColumns: [1],
        ratingColumns: [1],
        pageBreakBefore: true,
      },
    ),
    heading("Transition Plan Assessment", HeadingLevel.HEADING_2),
    paragraph(`Rating: ${report.transitionRating}`, { bold: true }),
    heading("Assessment Areas", HeadingLevel.HEADING_3),
    ...bulletList([
      "Alignment with DoD Critical Technology Areas",
      "Integration with acquisition pathways (e.g., STRATFI/TACFI)",
      "Feasibility of transition to Program of Record",
      "Stakeholder engagement and funding strategy",
    ]),
    heading("Analysis", HeadingLevel.HEADING_3),
    paragraph("Strengths:", { bold: true }),
    ...bulletList(report.transitionStrengths),
    paragraph("Weaknesses:", { bold: true }),
    ...bulletList(report.transitionWeaknesses),
    paragraph("Gaps vs DoD roadmaps:", { bold: true }),
    ...bulletList(report.transitionGaps),
    heading("Recommendations", HeadingLevel.HEADING_3),
    ...bulletList(report.transitionRecommendations),
    heading("Milestone Assessment", HeadingLevel.HEADING_2, true),
    ...report.milestoneItems.flatMap((milestone) => [milestoneCard(milestone), spacer(180)]),
    ...sectionTable("Summary Ratings", ["Overall Assessment", "Rating"], report.overallRows, {
      widths: [55, 45],
      centerColumns: [1],
      ratingColumns: [1],
    }),
    paragraph(`Overall Rating: ${report.overallRating}`, { bold: true }),
    paragraph(`Selectability Assessment: ${report.selectabilityAssessment}`, { bold: true }),
    heading("Key Strengths", HeadingLevel.HEADING_2),
    ...bulletList(report.keyStrengths),
    heading("Key Weaknesses / Risks", HeadingLevel.HEADING_2),
    ...bulletList(report.keyWeaknesses),
    heading("Recommended Next Steps", HeadingLevel.HEADING_2),
    ...bulletList(report.recommendedNextSteps),
    heading("Final Recommendation", HeadingLevel.HEADING_2, true),
    paragraph(`Decision: ${report.finalDecision}`, { bold: true, size: 24 }),
    paragraph(report.finalDecisionNote),
  ];

  const doc = new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: REPORT_FOOTER_TEXT, color: REPORT_COLORS.muted, italics: true, size: 18 })],
              }),
            ],
          }),
        },
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 900,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileSafe(project.name)}-evaluation-report.docx`);
};

type PdfAlign = "left" | "center" | "right";

type PdfColumn = {
  header: string;
  width: number;
  align?: PdfAlign;
  badge?: boolean;
};

const PDF_PAGE_WIDTH = 612;
const PDF_PAGE_HEIGHT = 792;
const PDF_MARGIN_X = 54;
const PDF_TOP = 54;
const PDF_BOTTOM = 720;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN_X * 2;

const pdfSafeText = (value: string) =>
  cleanEvaluatorText(value)
    .replace(/<=/g, "<=")
    .replace(/>=/g, ">=")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\()]/g, "\\$&");

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

const pdfColor = (hex: string) => {
  const [red, green, blue] = hexToRgb(hex);
  return `${(red / 255).toFixed(3)} ${(green / 255).toFixed(3)} ${(blue / 255).toFixed(3)}`;
};

const textWidth = (text: string, size: number) => cleanEvaluatorText(text).length * size * 0.5;

const wrapPdfText = (text: string, size: number, width: number) => {
  const words = cleanEvaluatorText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, size) <= width || !current) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

class PdfReportBuilder {
  private pages: string[][] = [];
  private y = PDF_TOP;

  constructor() {
    this.addPage();
  }

  private currentPage() {
    return this.pages[this.pages.length - 1];
  }

  private add(command: string) {
    this.currentPage().push(command);
  }

  private toPdfY(top: number, height = 0) {
    return PDF_PAGE_HEIGHT - top - height;
  }

  private addFooter() {
    this.drawText(PDF_PAGE_WIDTH / 2, PDF_PAGE_HEIGHT - 32, REPORT_FOOTER_TEXT, 8, "F3", REPORT_COLORS.muted, "center");
  }

  addPage() {
    this.pages.push([]);
    this.y = PDF_TOP;
    this.addFooter();
  }

  pageBreak() {
    if (this.y > PDF_TOP + 8) {
      this.addPage();
    }
  }

  ensure(height: number) {
    if (this.y + height > PDF_BOTTOM) {
      this.addPage();
    }
  }

  drawRect(x: number, top: number, width: number, height: number, fill?: string, stroke = REPORT_COLORS.border) {
    const y = this.toPdfY(top, height);
    if (fill) {
      this.add(`q ${pdfColor(fill)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`);
    }
    if (stroke) {
      this.add(
        `q ${pdfColor(stroke)} RG 0.6 w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S Q`,
      );
    }
  }

  drawText(
    x: number,
    top: number,
    text: string,
    size: number,
    font: "F1" | "F2" | "F3" = "F1",
    color = REPORT_COLORS.ink,
    align: PdfAlign = "left",
  ) {
    const safe = pdfSafeText(text);
    const width = textWidth(safe, size);
    const drawX = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
    this.add(`BT /${font} ${size.toFixed(2)} Tf ${pdfColor(color)} rg ${drawX.toFixed(2)} ${this.toPdfY(top).toFixed(2)} Td (${safe}) Tj ET`);
  }

  drawParagraph(
    text: string,
    options: {
      x?: number;
      width?: number;
      size?: number;
      lineHeight?: number;
      font?: "F1" | "F2" | "F3";
      color?: string;
      after?: number;
    } = {},
  ) {
    const x = options.x ?? PDF_MARGIN_X;
    const width = options.width ?? PDF_CONTENT_WIDTH;
    const size = options.size ?? 10;
    const lineHeight = options.lineHeight ?? size * 1.35;
    const lines = wrapPdfText(text, size, width);
    this.ensure(lines.length * lineHeight + (options.after ?? 8));

    lines.forEach((line) => {
      this.drawText(x, this.y, line, size, options.font, options.color);
      this.y += lineHeight;
    });

    this.y += options.after ?? 8;
  }

  drawHeading(text: string, level: 1 | 2 | 3, pageBreakBefore = false) {
    if (pageBreakBefore) {
      this.pageBreak();
    }

    const size = level === 1 ? 20 : level === 2 ? 15 : 12;
    const after = level === 1 ? 12 : 10;
    this.ensure(size + after + 6);
    this.drawText(PDF_MARGIN_X, this.y, text, size, "F2", level === 1 ? REPORT_COLORS.navy : REPORT_COLORS.ink);
    this.y += size + after;
  }

  drawBadge(x: number, top: number, label: string, options: { width?: number; height?: number; size?: number } = {}) {
    const width = options.width ?? Math.max(58, Math.min(118, textWidth(label, options.size ?? 8.5) + 20));
    const height = options.height ?? 18;
    const fill = ratingFill(label);
    const textColor = ratingTextColor(label);
    this.drawRect(x, top, width, height, fill, fill);
    this.drawText(x + width / 2, top + height / 2 + (options.size ?? 8.5) / 3, displayStatus(label), options.size ?? 8.5, "F2", textColor, "center");
  }

  drawTable(columns: PdfColumn[], rows: string[][]) {
    const headerHeight = 28;
    const drawHeader = () => {
      let x = PDF_MARGIN_X;
      columns.forEach((column) => {
        this.drawRect(x, this.y, column.width, headerHeight, REPORT_COLORS.navy, REPORT_COLORS.navy);
        this.drawText(
          column.align === "center" ? x + column.width / 2 : x + 6,
          this.y + 17,
          column.header,
          8.6,
          "F2",
          REPORT_COLORS.white,
          column.align ?? "left",
        );
        x += column.width;
      });
      this.y += headerHeight;
    };

    this.ensure(headerHeight + 30);
    drawHeader();

    rows.forEach((row, rowIndex) => {
      const rowLines = row.map((cell, index) =>
        columns[index]?.badge ? [displayStatus(cell)] : wrapPdfText(cell, 8.3, Math.max(20, (columns[index]?.width ?? 80) - 12)),
      );
      const rowHeight = Math.max(28, Math.max(...rowLines.map((lines) => lines.length)) * 10.5 + 14);

      if (this.y + rowHeight > PDF_BOTTOM) {
        this.addPage();
        drawHeader();
      }

      let x = PDF_MARGIN_X;
      row.forEach((cell, columnIndex) => {
        const column = columns[columnIndex];
        const fill = rowIndex % 2 === 1 ? REPORT_COLORS.rowAlt : REPORT_COLORS.white;
        this.drawRect(x, this.y, column.width, rowHeight, fill, REPORT_COLORS.border);

        if (column.badge) {
          const badgeWidth = Math.min(column.width - 12, Math.max(54, textWidth(displayStatus(cell), 8) + 18));
          this.drawBadge(x + (column.width - badgeWidth) / 2, this.y + 7, cell, { width: badgeWidth, height: 16, size: 7.8 });
        } else {
          rowLines[columnIndex].forEach((line, lineIndex) => {
            const textTop = this.y + 13 + lineIndex * 10.5;
            const textX =
              column.align === "center" ? x + column.width / 2 : column.align === "right" ? x + column.width - 6 : x + 6;
            this.drawText(textX, textTop, line, 8.3, "F1", REPORT_COLORS.ink, column.align ?? "left");
          });
        }
        x += column.width;
      });

      this.y += rowHeight;
    });

    this.y += 18;
  }

  drawExecutiveSummary(report: EvaluationReport) {
    const columnWidth = (PDF_CONTENT_WIDTH - 24) / 3;
    const summaryLines = wrapPdfText(report.overallAssessment, 9.6, PDF_CONTENT_WIDTH - 28);
    const columns = [
      ["Top 3 Strengths", takeTop(report.keyStrengths, 3, "No major strengths were identified.")],
      ["Top 3 Weaknesses", takeTop(report.keyWeaknesses, 3, "No major weaknesses were identified.")],
      ["Top 3 Next Actions", takeTop(report.recommendedNextSteps, 3, "Validate mandatory compliance items.")],
    ] as const;
    const columnHeights = columns.map(([, items]) =>
      28 + items.reduce((sum, item) => sum + wrapPdfText(`- ${item}`, 8.2, columnWidth - 12).length * 9.6 + 5, 0),
    );
    const boxHeight = 84 + summaryLines.length * 11.5 + Math.max(...columnHeights);

    this.ensure(boxHeight + 18);
    const top = this.y;
    this.drawRect(PDF_MARGIN_X, top, PDF_CONTENT_WIDTH, boxHeight, REPORT_COLORS.rowAlt, REPORT_COLORS.border);
    this.drawText(PDF_MARGIN_X + 14, top + 24, "Executive Summary", 14, "F2", REPORT_COLORS.navy);
    let cursor = top + 44;
    summaryLines.forEach((line) => {
      this.drawText(PDF_MARGIN_X + 14, cursor, line, 9.6, "F1", REPORT_COLORS.ink);
      cursor += 11.5;
    });
    this.drawText(PDF_MARGIN_X + 14, cursor + 6, `Selectability Recommendation: ${report.selectabilityAssessment}`, 9.6, "F2");
    cursor += 28;

    columns.forEach(([title, items], index) => {
      const x = PDF_MARGIN_X + 12 + index * (columnWidth + 6);
      this.drawRect(x, cursor, columnWidth, 22, REPORT_COLORS.navy, REPORT_COLORS.navy);
      this.drawText(x + columnWidth / 2, cursor + 14.5, title, 8.4, "F2", REPORT_COLORS.white, "center");
      const columnTop = cursor + 22;
      const columnHeight = boxHeight - (columnTop - top) - 14;
      this.drawRect(x, columnTop, columnWidth, columnHeight, REPORT_COLORS.white, REPORT_COLORS.border);
      let itemY = columnTop + 16;
      items.forEach((item) => {
        wrapPdfText(`- ${item}`, 8.2, columnWidth - 12).forEach((line) => {
          this.drawText(x + 6, itemY, line, 8.2, "F1", REPORT_COLORS.ink);
          itemY += 9.6;
        });
        itemY += 5;
      });
    });

    this.y = top + boxHeight + 18;
  }

  drawCover(report: EvaluationReport, score: number) {
    const metadataX = PDF_MARGIN_X;
    const metadataWidth = PDF_CONTENT_WIDTH - 146;
    const badgeX = PDF_MARGIN_X + PDF_CONTENT_WIDTH - 124;
    const badgeTop = 92;

    this.drawRect(PDF_MARGIN_X, 34, PDF_CONTENT_WIDTH, 4, REPORT_COLORS.navy, REPORT_COLORS.navy);
    this.y = 66;
    this.drawParagraph(report.title, {
      x: metadataX,
      width: metadataWidth,
      color: REPORT_COLORS.navy,
      size: 17,
      lineHeight: 21,
      font: "F2",
      after: 10,
    });
    this.drawParagraph(report.subtitle, { x: metadataX, width: metadataWidth, color: REPORT_COLORS.muted, size: 9.5, after: 10 });

    this.drawRect(badgeX, badgeTop, 124, 94, ratingFill(report.overallRating), ratingFill(report.overallRating));
    this.drawText(badgeX + 62, badgeTop + 42, String(score), 30, "F2", ratingTextColor(report.overallRating), "center");
    this.drawText(badgeX + 62, badgeTop + 61, "Readiness Score", 8.5, "F2", ratingTextColor(report.overallRating), "center");
    this.drawText(badgeX + 62, badgeTop + 79, report.overallRating, 10, "F2", ratingTextColor(report.overallRating), "center");

    [
      `Proposal Title: ${report.proposalTitle}`,
      `Topic Number: ${report.topicNumber}`,
      `Phase: ${report.phase}`,
      `Generated: ${report.generatedDate}`,
      `Overall Rating: ${report.overallRating}`,
    ].forEach((line) => this.drawParagraph(line, { x: metadataX, width: metadataWidth, size: 9.6, font: "F2", after: 2 }));

    this.y = Math.max(this.y + 8, badgeTop + 112);
  }

  drawMilestoneCard(milestone: MilestoneReportItem) {
    const labelWidth = 130;
    const valueWidth = PDF_CONTENT_WIDTH - labelWidth;
    const rows = [
      ["Description", milestone.description],
      ["R&D Value", milestone.rdValue],
      ["Rating", milestone.rating],
      ["Improvement Recommendations", milestone.recommendations],
    ];
    const rowHeights = rows.map(([label, value]) =>
      label === "Rating" ? 30 : Math.max(30, wrapPdfText(value, 8.5, valueWidth - 12).length * 10.5 + 14),
    );
    const height = 28 + rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0);

    this.ensure(height + 16);
    this.drawRect(PDF_MARGIN_X, this.y, PDF_CONTENT_WIDTH, 28, REPORT_COLORS.navy, REPORT_COLORS.navy);
    this.drawText(PDF_MARGIN_X + 8, this.y + 18, `Milestone ${milestone.number}`, 9.5, "F2", REPORT_COLORS.white);
    this.y += 28;

    rows.forEach(([label, value], index) => {
      const rowHeight = rowHeights[index];
      this.drawRect(PDF_MARGIN_X, this.y, labelWidth, rowHeight, REPORT_COLORS.rowAlt, REPORT_COLORS.border);
      this.drawText(PDF_MARGIN_X + 7, this.y + 17, label, 8.5, "F2");
      this.drawRect(PDF_MARGIN_X + labelWidth, this.y, valueWidth, rowHeight, REPORT_COLORS.white, REPORT_COLORS.border);
      if (label === "Rating") {
        this.drawBadge(PDF_MARGIN_X + labelWidth + 8, this.y + 7, value, { width: 96, height: 16, size: 8 });
      } else {
        wrapPdfText(value, 8.5, valueWidth - 12).forEach((line, lineIndex) => {
          this.drawText(PDF_MARGIN_X + labelWidth + 7, this.y + 17 + lineIndex * 10.5, line, 8.5);
        });
      }
      this.y += rowHeight;
    });

    this.y += 16;
  }

  buildBlob() {
    const objects: string[] = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>",
    ];
    const pageRefs: number[] = [];

    this.pages.forEach((pageCommands, index) => {
      const pageObjectNumber = 6 + index * 2;
      const contentObjectNumber = pageObjectNumber + 1;
      pageRefs.push(pageObjectNumber);
      const stream = pageCommands.join("\n");
      objects[pageObjectNumber - 1] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
      objects[contentObjectNumber - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }
}

export const exportEvaluationReportPdf = (project: Project) => {
  const report = buildEvaluationReport(project);
  const score = project.evaluation?.readinessScore ?? 0;
  const pdf = new PdfReportBuilder();

  pdf.drawCover(report, score);
  pdf.drawExecutiveSummary(report);

  pdf.drawHeading("Proposal Information", 2);
  pdf.drawTable(
    [
      { header: "Field", width: 165 },
      { header: "Value", width: PDF_CONTENT_WIDTH - 165 },
    ],
    report.proposalInfoRows,
  );

  pdf.drawHeading("Mandatory Criteria Review", 2);
  pdf.drawTable(
    [
      { header: "Mandatory Criteria", width: 210 },
      { header: "Status", width: 92, align: "center", badge: true },
      { header: "Notes", width: PDF_CONTENT_WIDTH - 302 },
    ],
    criteriaRowsToTableRows(report.mandatoryRows),
  );
  pdf.drawParagraph(`Result: ${report.mandatoryResult}`, { font: "F2", after: 14 });

  pdf.drawHeading("Additional Compliance Criteria", 2);
  pdf.drawTable(
    [
      { header: "Additional Criteria", width: 205 },
      { header: "Status", width: 92, align: "center", badge: true },
      { header: "Assessment Notes", width: PDF_CONTENT_WIDTH - 297 },
    ],
    criteriaRowsToTableRows(report.additionalRows),
  );

  pdf.drawHeading("Technical Merit Review", 2, true);
  pdf.drawTable(
    [
      { header: "Criteria", width: 124 },
      { header: "Rating", width: 78, align: "center", badge: true },
      { header: "Evaluator Justification", width: 152 },
      { header: "How to Improve to Excellent", width: PDF_CONTENT_WIDTH - 354 },
    ],
    report.technicalRows,
  );

  pdf.drawHeading("Defense Need Review", 2, true);
  pdf.drawTable(
    [
      { header: "Criteria", width: 124 },
      { header: "Rating", width: 78, align: "center", badge: true },
      { header: "Evaluator Justification", width: 152 },
      { header: "How to Improve to Excellent", width: PDF_CONTENT_WIDTH - 354 },
    ],
    report.defenseRows,
  );

  pdf.drawHeading("Commercialization Review", 2, true);
  pdf.drawTable(
    [
      { header: "Criteria", width: 124 },
      { header: "Rating", width: 78, align: "center", badge: true },
      { header: "Evaluator Justification", width: 152 },
      { header: "How to Improve to Excellent", width: PDF_CONTENT_WIDTH - 354 },
    ],
    report.commercializationRows,
  );

  pdf.drawHeading("Transition Plan Assessment", 2);
  pdf.drawParagraph(`Rating: ${report.transitionRating}`, { font: "F2", after: 8 });
  pdf.drawHeading("Assessment Areas", 3);
  [
    "Alignment with DoD Critical Technology Areas",
    "Integration with acquisition pathways (e.g., STRATFI/TACFI)",
    "Feasibility of transition to Program of Record",
    "Stakeholder engagement and funding strategy",
  ].forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawHeading("Analysis", 3);
  pdf.drawParagraph("Strengths:", { font: "F2", after: 2 });
  report.transitionStrengths.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawParagraph("Weaknesses:", { font: "F2", after: 2 });
  report.transitionWeaknesses.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawParagraph("Gaps vs DoD roadmaps:", { font: "F2", after: 2 });
  report.transitionGaps.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawHeading("Recommendations", 3);
  report.transitionRecommendations.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));

  pdf.drawHeading("Milestone Assessment", 2, true);
  report.milestoneItems.forEach((milestone) => pdf.drawMilestoneCard(milestone));

  pdf.drawHeading("Summary Ratings", 2);
  pdf.drawTable(
    [
      { header: "Overall Assessment", width: 260 },
      { header: "Rating", width: PDF_CONTENT_WIDTH - 260, align: "center", badge: true },
    ],
    report.overallRows,
  );

  pdf.drawHeading("Key Strengths", 2);
  report.keyStrengths.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawHeading("Key Weaknesses / Risks", 2);
  report.keyWeaknesses.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));
  pdf.drawHeading("Recommended Next Steps", 2);
  report.recommendedNextSteps.forEach((item) => pdf.drawParagraph(`- ${item}`, { size: 9, after: 2 }));

  pdf.drawHeading("Final Recommendation", 2, true);
  pdf.drawParagraph(`Decision: ${report.finalDecision}`, { font: "F2", size: 12, after: 8 });
  pdf.drawParagraph(report.finalDecisionNote);

  downloadBlob(pdf.buildBlob(), `${fileSafe(project.name)}-evaluation-report.pdf`);
};
