import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { ProjectInput } from "../types";

type NewProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (input: ProjectInput) => void;
};

const initialInput: ProjectInput = {
  name: "",
  agency: "DoD",
  program: "SBIR",
  topicId: "",
  phase: "Phase I",
  dueDate: "",
};

export const NewProjectModal = ({ isOpen, onClose, onCreateProject }: NewProjectModalProps) => {
  const [input, setInput] = useState<ProjectInput>(initialInput);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.name.trim()) return;

    onCreateProject(input);
    setInput(initialInput);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={handleSubmit}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">New project</p>
            <h2>Proposal workspace</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        <label>
          Project name
          <input
            autoFocus
            required
            value={input.name}
            onChange={(event) => setInput((current) => ({ ...current, name: event.target.value }))}
            placeholder="Autonomous sensor fusion Phase I"
          />
        </label>

        <div className="form-grid">
          <label>
            Agency
            <select
              value={input.agency}
              onChange={(event) => setInput((current) => ({ ...current, agency: event.target.value }))}
            >
              <option>DoD</option>
              <option>NASA</option>
              <option>NSF</option>
              <option>DOE</option>
              <option>NIH</option>
              <option>DHS</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Program
            <select
              value={input.program}
              onChange={(event) => setInput((current) => ({ ...current, program: event.target.value }))}
            >
              <option>SBIR</option>
              <option>STTR</option>
              <option>BAA</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Phase
            <select
              value={input.phase}
              onChange={(event) => setInput((current) => ({ ...current, phase: event.target.value }))}
            >
              <option>Phase I</option>
              <option>Phase II</option>
              <option>Direct to Phase II</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Due date
            <input
              type="date"
              value={input.dueDate}
              onChange={(event) => setInput((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </label>
        </div>

        <label>
          Topic ID
          <input
            value={input.topicId}
            onChange={(event) => setInput((current) => ({ ...current, topicId: event.target.value }))}
            placeholder="AF26.1-123"
          />
        </label>

        <footer className="modal-actions">
          <button className="button ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            Create Project
          </button>
        </footer>
      </form>
    </div>
  );
};
