import { AlertTriangle, CheckCircle2, CircleDot, Sparkles } from "lucide-react";
import { EvaluationResult } from "../types";

type EvaluationPanelProps = {
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
  { key: "complianceGaps", title: "Compliance Gaps" },
  { key: "technicalMerit", title: "Technical Merit Feedback" },
  { key: "commercialization", title: "Commercialization Feedback" },
  { key: "transitionPotential", title: "DoD Transition Potential" },
  { key: "rewriteActions", title: "Recommended Rewrite Actions" },
];

const scoreLabel = (score: number) => {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Developing";
  return "Needs work";
};

export const EvaluationPanel = ({ evaluation }: EvaluationPanelProps) => {
  if (!evaluation) {
    return (
      <div className="empty-state evaluation-empty">
        <Sparkles size={34} />
        <h2>No evaluation yet</h2>
        <p>Run an evaluation from the Inputs tab to generate reviewer-style feedback.</p>
      </div>
    );
  }

  return (
    <div className="evaluation-panel">
      <section className="score-band">
        <div>
          <p className="eyebrow">Readiness score</p>
          <h2>{evaluation.readinessScore}</h2>
        </div>
        <span className="score-label">{scoreLabel(evaluation.readinessScore)}</span>
        <p>{evaluation.confidenceNote}</p>
      </section>

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
