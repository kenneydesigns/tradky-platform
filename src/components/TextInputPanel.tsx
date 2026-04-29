import { ChangeEvent, useRef, useState } from "react";
import { ClipboardPaste, FileText, Upload } from "lucide-react";
import { Project } from "../types";
import { readTextFile } from "../utils/textFiles";

type TextInputPanelProps = {
  project: Project;
  isEvaluating: boolean;
  onRunEvaluation: () => void;
  onUpdateProject: (project: Project) => void;
};

type TextAreaCardProps = {
  title: string;
  icon: "solicitation" | "draft";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const TextAreaCard = ({ title, icon, value, placeholder, onChange }: TextAreaCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await readTextFile(file);
    setFileName(file.name);
    onChange(text);
    event.target.value = "";
  };

  return (
    <section className="text-card">
      <header className="panel-header">
        <div>
          <p className="eyebrow">{icon === "solicitation" ? "Topic source" : "Draft source"}</p>
          <h2>{title}</h2>
        </div>
        <button className="button compact" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={16} />
          Upload Text
        </button>
        <input ref={inputRef} className="visually-hidden" type="file" accept=".txt,.md,.rtf,.csv" onChange={handleFile} />
      </header>

      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />

      <footer className="text-card-footer">
        <span>{countWords(value)} words</span>
        <span>{fileName || "Paste or upload text"}</span>
      </footer>
    </section>
  );
};

export const TextInputPanel = ({ project, isEvaluating, onRunEvaluation, onUpdateProject }: TextInputPanelProps) => {
  const hasInputs = project.solicitationText.trim().length > 0 || project.proposalText.trim().length > 0;

  return (
    <div className="input-panel">
      <div className="input-grid">
        <TextAreaCard
          title="Solicitation / Topic Text"
          icon="solicitation"
          value={project.solicitationText}
          placeholder="Paste the SBIR/STTR topic, BAA instructions, evaluation criteria, and submission requirements."
          onChange={(solicitationText) => onUpdateProject({ ...project, solicitationText })}
        />

        <TextAreaCard
          title="Draft Proposal / Technical Volume"
          icon="draft"
          value={project.proposalText}
          placeholder="Paste the current technical volume draft, notes, outline, or section fragments."
          onChange={(proposalText) => onUpdateProject({ ...project, proposalText })}
        />
      </div>

      <div className="action-strip">
        <div>
          <FileText size={18} />
          <span>
            {project.solicitationText.trim() && project.proposalText.trim()
              ? "Ready for evaluation"
              : "Add solicitation and draft text for the best evaluation"}
          </span>
        </div>
        <button className="button primary" type="button" disabled={!hasInputs || isEvaluating} onClick={onRunEvaluation}>
          <ClipboardPaste size={18} />
          {isEvaluating ? "Evaluating..." : "Run Evaluation"}
        </button>
      </div>
    </div>
  );
};
