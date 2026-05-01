import { AlertTriangle, CheckCircle2, CircleDot, Download, FileDown, ListChecks, Sparkles } from "lucide-react";
import { EvaluationResult, Project } from "../types";
import { exportEvaluationReportDocx, exportEvaluationReportMarkdown, exportEvaluationReportPdf } from "../utils/exporters";

type EvaluationPanelProps = {
  project: Project;
  evaluation: EvaluationResult | null;
};

const categoryData: Array<{
  key: keyof Pick<
    EvaluationResult,
    | "strengths"
    | "weaknesses"
    | "complianceGaps"
    | "technicalMerit"
    | "commercialization"
    | "transitionPotential"
    | "rewriteActions"
  >;
  title: string;
}> = [
  { key: "strengths", title: "Strengths" },
  { key: "weaknesses", title: "Weaknesses" },
  { key: "complianceGaps", title: "Compliance / Evidence Gaps" },
  { key: "technicalMerit", title: "Technical / Intellectual Merit Feedback" },
  { key: "commercialization", title: "Commercialization / Impact Feedback" },
  { key: "transitionPotential", title: "Mission / Team / Environment Fit" },
  { key: "rewriteActions", title: "Priority Actions" },
];

const scoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Competitive";
  if (score >= 50) return "Acceptable";
  if (score >= 30) return "Marginal";
  return "Poor";
};

export const EvaluationPanel = ({ project, evaluation }: EvaluationPanelProps) => {
  if (!evaluation) {
    return (
      <div className="empty-state evaluation-empty">
        <Sparkles size={34} />
        <h2>No evaluation yet</h2>
        <p>Run an evaluation from the Inputs tab to generate reviewer-style feedback.</p>
      </div>
    );
  }

  const fundingDecision = evaluation.multiAgencyEvaluation?.funding_decision;
  const primaryFailureReason = evaluation.multiAgencyEvaluation?.primary_failure_reason;

  return (
    <div className="evaluation-panel">
      <section className="score-band">
        <div>
          <p className="eyebrow">Multi-agency evaluator score</p>
          <h2>{evaluation.readinessScore}</h2>
        </div>
        <div className="score-pill-stack">
          <span className="score-label">{scoreLabel(evaluation.readinessScore)}</span>
          {fundingDecision ? (
            <span className={`decision-pill ${fundingDecision === "Select" ? "select" : "do-not-select"}`}>
              {fundingDecision}
            </span>
          ) : null}
        </div>
        <div className="score-summary">
          <p>{evaluation.confidenceNote}</p>
          {primaryFailureReason ? <p className="primary-failure">Primary failure driver: {primaryFailureReason}</p> : null}
        </div>
        <div className="evaluation-report-actions">
          <button className="button evaluation-report-button" type="button" onClick={() => exportEvaluationReportMarkdown(project)}>
            <Download size={17} />
            MD Report
          </button>
          <button className="button evaluation-report-button" type="button" onClick={() => void exportEvaluationReportPdf(project)}>
            <Download size={17} />
            PDF Report
          </button>
          <button className="button primary evaluation-report-button" type="button" onClick={() => void exportEvaluationReportDocx(project)}>
            <FileDown size={17} />
            DOCX Report
          </button>
        </div>
      </section>

      {evaluation.rubricScores?.length ? (
        <section className="rubric-panel" aria-label="Agency rubric rankings">
          <header>
            <ListChecks size={18} />
            <div>
              <p className="eyebrow">Evaluator rankings</p>
              <h3>Agency rubric 1-5 scoring logic</h3>
            </div>
          </header>
          <div className="rubric-grid">
            {evaluation.rubricScores.map((rubricScore) => (
              <article className="rubric-card" key={rubricScore.key}>
                <div className="rubric-card-heading">
                  <div>
                    <h4>{rubricScore.title}</h4>
                    <span>{rubricScore.label}</span>
                  </div>
                  <strong>{rubricScore.score}/5</strong>
                </div>
                <p>{rubricScore.rationale}</p>
                <ul>
                  {[...rubricScore.strengths.slice(0, 2), ...rubricScore.gaps.slice(0, 2)].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {evaluation.costVolumeChecks?.length ? (
        <section className="cost-volume-panel" aria-label="Cost volume checks">
          <header>
            <CircleDot size={18} />
            <h3>Cost Volume Checks</h3>
          </header>
          <div>
            {evaluation.costVolumeChecks.map((check) => (
              <article key={check.question}>
                <span className={`cost-status ${check.status.toLowerCase().replace("/", "-")}`}>{check.status}</span>
                <p>{check.question}</p>
                <small>{check.rationale}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="evaluation-grid">
        {categoryData.map((category) => {
          const items = evaluation[category.key] as string[];

          return (
            <section className="evaluation-card" key={category.key}>
              <header>
                {category.key === "strengths" ? (
                  <CheckCircle2 size={18} />
                ) : category.key === "weaknesses" || category.key === "complianceGaps" ? (
                  <AlertTriangle size={18} />
                ) : (
                  <CircleDot size={18} />
                )}
                <h3>{category.title}</h3>
              </header>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
