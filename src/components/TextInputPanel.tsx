import { ChangeEvent, useRef, useState } from "react";
import { ClipboardPaste, FileText, Upload } from "lucide-react";
import { Project } from "../types";
import { ACCEPTED_SOURCE_FILE_TYPES, readTextFile } from "../utils/textFiles";
import { prefillSectionsFromTechnicalVolume } from "../utils/volumeSectionHydrator";

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
  onUpload?: (value: string, file: File) => string | void;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const TextAreaCard = ({ title, icon, value, placeholder, onChange, onUpload }: TextAreaCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setFileError("");

    try {
      const text = await readTextFile(file);
      const uploadStatus = onUpload?.(text, file);
      if (!onUpload) {
        onChange(text);
      }
      setFileName(uploadStatus || file.name);
    } catch (caught) {
      setFileName("");
      setFileError(caught instanceof Error ? caught.message : "File upload failed");
    } finally {
      setIsReadingFile(false);
      event.target.value = "";
    }
  };

  return (
    <section className="text-card">
      <header className="panel-header">
        <div>
          <p className="eyebrow">{icon === "solicitation" ? "Topic source" : "Draft source"}</p>
          <h2>{title}</h2>
        </div>
        <button className="button compact" type="button" disabled={isReadingFile} onClick={() => inputRef.current?.click()}>
          <Upload size={16} />
          {isReadingFile ? "Reading..." : "Upload File"}
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept={ACCEPTED_SOURCE_FILE_TYPES}
          onChange={handleFile}
        />
      </header>

      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />

      <footer className="text-card-footer">
        <span>{countWords(value)} words</span>
        <span className={fileError ? "file-error" : ""}>{fileError || fileName || "Paste or upload a source file"}</span>
      </footer>
    </section>
  );
};

export const TextInputPanel = ({ project, isEvaluating, onRunEvaluation, onUpdateProject }: TextInputPanelProps) => {
  const hasSolicitation = project.solicitationText.trim().length > 0;
  const hasTechnicalVolume = project.proposalText.trim().length > 0;

  const updateTechnicalVolumeFromUpload = (proposalText: string, file: File) => {
    const result = prefillSectionsFromTechnicalVolume(project.sections, proposalText);

    onUpdateProject({
      ...project,
      proposalText,
      sections: result.sections,
    });

    return result.matchedKeys.length
      ? `${file.name} • ${result.matchedKeys.length} builder sections prefilled`
      : `${file.name} • volume loaded`;
  };

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
          placeholder="Paste or upload the current technical volume draft, notes, outline, or section fragments."
          onChange={(proposalText) => onUpdateProject({ ...project, proposalText })}
          onUpload={updateTechnicalVolumeFromUpload}
        />
      </div>

      <div className="action-strip">
        <div>
          <FileText size={18} />
          <span>
            {hasSolicitation && hasTechnicalVolume
              ? "Ready to analyze the technical volume"
              : hasTechnicalVolume
                ? "Ready to analyze; add solicitation text for tighter review"
              : "Add or upload a technical volume for analysis"}
          </span>
        </div>
        <button className="button primary" type="button" disabled={!hasTechnicalVolume || isEvaluating} onClick={onRunEvaluation}>
          <ClipboardPaste size={18} />
          {isEvaluating ? "Analyzing..." : "Analyze Technical Volume"}
        </button>
      </div>
    </div>
  );
};
