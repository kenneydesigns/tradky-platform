import { useState } from "react";
import { ArrowLeft, ClipboardList, FileText, Layers3, Save, Trash2 } from "lucide-react";
import { EvaluationPanel } from "./EvaluationPanel";
import { TextInputPanel } from "./TextInputPanel";
import { VolumeBuilder } from "./VolumeBuilder";
import { evaluateProposal } from "../services/aiClient";
import { Project } from "../types";

type ProjectWorkspaceProps = {
  project: Project;
  onBackToDashboard: () => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (project: Project) => void;
};

type TabKey = "inputs" | "evaluation" | "builder";

const tabs: Array<{ key: TabKey; label: string; icon: typeof FileText }> = [
  { key: "inputs", label: "Inputs", icon: FileText },
  { key: "evaluation", label: "Evaluation", icon: ClipboardList },
  { key: "builder", label: "Builder", icon: Layers3 },
];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export const ProjectWorkspace = ({
  project,
  onBackToDashboard,
  onDeleteProject,
  onUpdateProject,
}: ProjectWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("inputs");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState("");

  const runEvaluation = async () => {
    setIsEvaluating(true);
    setError("");

    try {
      const evaluation = await evaluateProposal({
        project,
        solicitationText: project.solicitationText,
        proposalText: project.proposalText,
      });
      onUpdateProject({ ...project, evaluation });
      setActiveTab("evaluation");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="workspace">
      <header className="workspace-header">
        <button className="button ghost" type="button" onClick={onBackToDashboard}>
          <ArrowLeft size={17} />
          Dashboard
        </button>
        <div className="workspace-title">
          <p className="eyebrow">
            {project.agency} {project.program} {project.topicId ? `• ${project.topicId}` : ""}
          </p>
          <h1>{project.name}</h1>
          <span>
            <Save size={15} />
            Saved locally {formatDateTime(project.updatedAt)}
          </span>
        </div>
        <button className="icon-button danger" type="button" onClick={() => onDeleteProject(project.id)} title="Delete project">
          <Trash2 size={18} />
        </button>
      </header>

      <div className="tabs" role="tablist" aria-label="Project workspace sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              className={activeTab === tab.key ? "active" : ""}
              type="button"
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {activeTab === "inputs" ? (
        <TextInputPanel
          project={project}
          isEvaluating={isEvaluating}
          onRunEvaluation={runEvaluation}
          onUpdateProject={onUpdateProject}
        />
      ) : null}

      {activeTab === "evaluation" ? <EvaluationPanel evaluation={project.evaluation} /> : null}

      {activeTab === "builder" ? <VolumeBuilder project={project} onUpdateProject={onUpdateProject} /> : null}
    </div>
  );
};
