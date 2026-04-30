export const DAF_AFWERX_RUBRIC_CATEGORY_KEYS = ["commercialization", "defenseNeed", "technicalMerit"];

export const DAF_AFWERX_SCORE_LABELS = {
  5: "Excellent",
  4: "Good",
  3: "Acceptable",
  2: "Marginal",
  1: "Poor",
};

export const DAF_AFWERX_RUBRIC = [
  {
    key: "commercialization",
    title: "Commercialization",
    criteria: [
      {
        title: "Market and Revenue Potential",
        helpfulQuestions: [
          "How big is the market opportunity?",
          "Could this solution disrupt a market or create a new market segment?",
          "If successful, how large is this solution's revenue potential?",
        ],
        ratings: {
          5: "Solution likely to create a new market segment or disrupt a current segment and potential for large scale revenue.",
          4: "Solution may create a new market segment or disrupt a current segment and potential for medium scale revenue.",
          3: "Solution likely to occupy a market niche and potential for medium scale revenue.",
          2: "Solution may occupy a market niche with potential for small scale revenue.",
          1: "No clear market niche and/or limited potential for revenue.",
        },
      },
      {
        title: "Business Plan",
        helpfulQuestions: [
          "How clear is the company's plan to capture revenue from the solution?",
          "How likely is the company to achieve commercial viability with the plan proposed?",
        ],
        ratings: {
          5: "Very clear and highly logical business plan; business is very likely to achieve commercial viability for the solution.",
          4: "Clear and logical business plan; business is likely to achieve commercial viability for the solution.",
          3: "Clear and logical business plan; unclear if business can achieve commercial viability.",
          2: "Somewhat clear and partially logical business plan; unclear commercial viability.",
          1: "Unclear and illogical business plan.",
        },
      },
      {
        title: "Defense and Private Interest",
        helpfulQuestions: [
          "How strong is defense customer interest, and does that customer have funds available?",
          "How likely is investor funding or non-government revenue for the solution?",
          "Does the company have a history of commercialization with related solutions?",
        ],
        ratings: {
          5: "Very strong indication of a Defense customer with a major funding source and/or significant investor funding or significant non-government revenue for the solution.",
          4: "Very strong indication of a Defense customer with funding, investor or non-government revenue, and/or history of large commercialization success.",
          3: "Strong indication of a Defense customer and/or investor funding, non-government revenue, or history of commercialization success.",
          2: "Limited indication of Defense customer and/or investor funding for the current solution.",
          1: "Unclear indication of customers or investor funding.",
        },
      },
      {
        title: "CM and Supporting Documents",
        phase2Only: true,
        helpfulQuestions: [
          "Does the proposal have a clear, sound transition strategy?",
          "Does the proposal have commitments of government or private sector funding?",
        ],
        ratings: {
          5: "Very clear, sound transition strategy and commitment of non-SBIR funds for the Phase II work.",
          4: "Very clear, sound transition strategy.",
          3: "Mostly clear, sound transition strategy.",
          2: "Plausible transition strategy.",
          1: "Questionable or incomplete transition strategy.",
        },
      },
    ],
  },
  {
    key: "defenseNeed",
    title: "Defense Need",
    criteria: [
      {
        title: "Level of Mission Impact and Urgency of Need",
        helpfulQuestions: [
          "Does the proposal address an immediate operational need?",
          "How big of an impact will the project have on the defense capability gap?",
          "How important is the defense capability gap being addressed?",
        ],
        ratings: {
          5: "Addresses immediate and critical operational need and/or major impact to critically important defense capability.",
          4: "Major impact to an important defense capability.",
          3: "Moderate impact on an important defense capability or major impact on a somewhat important defense capability.",
          2: "Moderate impact on a marginally important defense capability.",
          1: "Small or unclear impact on a marginally important defense capability.",
        },
      },
      {
        title: "Breadth of Applicability",
        helpfulQuestions: [
          "How broad is the project impact across the DAF?",
          "Does the project impact multiple bases or major systems?",
        ],
        ratings: {
          5: "Impacts more than one AF MAJCOM or SF Field Command, or technology is usable across more than one platform.",
          4: "Impacts multiple units, or technology has potential for extension across more than one platform.",
          3: "Impacts a single unit, or technology impacts a single system.",
          2: "Narrow impact to a single unit or single system.",
          1: "Narrow impact to a single subsystem.",
        },
      },
      {
        title: "Specificity of Defense Need and Adequacy of Effort",
        helpfulQuestions: [
          "Is there a specific use case identified with a clear operational application?",
          "Will the project fulfill the defense need?",
        ],
        ratings: {
          5: "Very specific use case with very clear application and will clearly fulfill the need.",
          4: "Specific use case with clear application and will clearly fulfill the need.",
          3: "Specific use case with mostly clear application and likely to fulfill the need.",
          2: "Broad use case and likely to fulfill the need.",
          1: "Vague use case and unclear if it will fulfill the need.",
        },
      },
      {
        title: "CM and Supporting Documents",
        phase2Only: true,
        helpfulQuestions: [
          "Is the proposal aligned with the CM?",
          "Are the end users and customers appropriate for the CM with two different signatures?",
          "Are milestones consistent across all documents?",
        ],
        ratings: {
          5: "Proposal clearly aligned with memo; both end user and customer appropriate; milestones consistent.",
          4: "Proposal mostly aligned with memo; both end user and customer appropriate; milestones consistent.",
          3: "Proposal mostly aligned with memo; either end user or customer appropriate; milestones consistent.",
          2: "Proposal somewhat aligned with memo; either end user or customer appropriate; milestones inconsistent.",
          1: "Proposal not aligned with memo; both end user and customer not appropriate; milestones inconsistent.",
        },
      },
    ],
  },
  {
    key: "technicalMerit",
    title: "Technical Merit",
    criteria: [
      {
        title: "Problem and Use Case Framing",
        helpfulQuestions: ["Is the technical problem clear and understood?", "Are the end user use cases clear?"],
        ratings: {
          5: "Very clear problem and end user use cases.",
          4: "Clear problem and end user use cases.",
          3: "Mostly clear problem and end user use cases.",
          2: "Somewhat clear problem and end user use cases.",
          1: "Unclear problem and end user use cases.",
        },
      },
      {
        title: "Technical Approach Soundness and Merit",
        helpfulQuestions: [
          "Is the technical approach sound and logical?",
          "How likely is the approach to deliver the stated objectives?",
          "Does the technical approach contain relevant details?",
        ],
        ratings: {
          5: "Highly logical and sound.",
          4: "Mostly logical and sound; may be missing minor details.",
          3: "Moderately logical and sound.",
          2: "Somewhat logical and sound; may be missing key details in proposal.",
          1: "Illogical and incomplete.",
        },
      },
      {
        title: "Level of Risk",
        helpfulQuestions: [
          "What is the level of technical risk?",
          "Is it appropriate to accept this risk given this is an SBIR/STTR R&D proposal with inherent risk?",
          "Have risks been identified in the proposal and are there plans to mitigate?",
        ],
        ratings: {
          5: "Acceptable level of risk; all major risks mitigated.",
          4: "Acceptable level of risk; some major residual risks remain.",
          3: "Acceptable level of risk even with several remaining major risks.",
          2: "Unacceptable technical risk; some potential for mitigation.",
          1: "Unacceptable technical risk with no chance for mitigation.",
        },
      },
      {
        title: "Innovation",
        helpfulQuestions: [
          "Is the solution unique, original, or novel compared to the current state of the art?",
          "Is the technology brand-new to the government, or is it an adaptation of existing government technology?",
          "Are there other companies offering the same or similar solution?",
        ],
        ratings: {
          5: "Radically innovative solution; cutting edge technology.",
          4: "Highly innovative solution.",
          3: "Mostly innovative solution.",
          2: "Moderately innovative, such as re-application of existing government technology to a new government customer.",
          1: "Somewhat or not innovative.",
        },
      },
      {
        title: "Team Qualifications",
        helpfulQuestions: [
          "Does the team have relevant experience and expertise and the needed facilities or equipment?",
          "Has the team demonstrated an ability to perform R&D?",
          "What is the overall ability to execute the proposed approach?",
        ],
        ratings: {
          5: "Extraordinarily qualified.",
          4: "Highly qualified.",
          3: "Mostly qualified.",
          2: "Moderately qualified.",
          1: "Somewhat qualified or not qualified enough for the proposed approach.",
        },
      },
    ],
  },
];

export const DAF_AFWERX_COST_VOLUME_CHECKS = [
  "Is the proposed material/equipment appropriate for the proposed technical effort, if applicable?",
  "Is the proposed number of personnel, labor skill mix, and number of hours appropriate for the proposed technical effort?",
  "Are proposed specialized efforts, such as machining, milling, special testing or analysis, or lease of special equipment, appropriate for the proposed technical effort, if applicable?",
  "Is proposed travel, including destinations and number of travelers, appropriate for the technical effort to be accomplished, if applicable?",
  "Is the use of subcontractors/consultants appropriate for the proposed technical effort, if applicable?",
];

export const getDafAfwerxRatingLabel = (score) => {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return DAF_AFWERX_SCORE_LABELS[rounded];
};

export const getDafAfwerxReadinessScore = (scores) => {
  const validScores = scores.filter((score) => Number.isFinite(score)).map((score) => Math.min(5, Math.max(1, score)));
  if (!validScores.length) return 0;
  const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  return Math.round((average / 5) * 100);
};

export const DAF_AFWERX_RUBRIC_PROMPT = DAF_AFWERX_RUBRIC.map((category) => {
  const criteria = category.criteria
    .map((criterion) => {
      const phase = criterion.phase2Only ? " (Phase II only)" : "";
      const ratings = [5, 4, 3, 2, 1]
        .map((score) => `${score} ${DAF_AFWERX_SCORE_LABELS[score]}: ${criterion.ratings[score]}`)
        .join(" ");
      return `${criterion.title}${phase}. Helpful questions: ${criterion.helpfulQuestions.join(" ")} Ratings: ${ratings}`;
    })
    .join("\n");

  return `${category.title}:\n${criteria}`;
}).join("\n\n");
