import { FormEvent, KeyboardEvent, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_SOLICITATION_PROFILE_KEY, SOLICITATION_PROFILE_OPTIONS, getProfileDefaults } from "../data/solicitationProfiles";
import { ProjectInput, SolicitationProfileKey } from "../types";

type NewProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (input: ProjectInput) => void;
};

const defaultProfile = getProfileDefaults(DEFAULT_SOLICITATION_PROFILE_KEY);
const programOptions = ["SBIR", "STTR", "SBIR/STTR", "BAA", "Other"];
const phaseOptions = ["Phase I", "Phase II", "Direct to Phase II", "Other"];

const initialInput: ProjectInput = {
  name: "",
  agency: defaultProfile.agency,
  program: defaultProfile.program,
  topicId: "",
  phase: "Phase I",
  dueDate: "",
  solicitationProfile: defaultProfile.solicitationProfile,
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

  const handleProfileChange = (solicitationProfile: SolicitationProfileKey) => {
    const profileDefaults = getProfileDefaults(solicitationProfile);
    setInput((current) => ({
      ...current,
      solicitationProfile: profileDefaults.solicitationProfile,
      agency: profileDefaults.agency,
      program: profileDefaults.program,
    }));
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.metaKey || event.ctrlKey) return;
    if (event.target instanceof HTMLInputElement && !event.target.getAttribute("list")) {
      event.preventDefault();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
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

        <label>
          Solicitation profile
          <select
            value={input.solicitationProfile}
            onChange={(event) => handleProfileChange(event.target.value as SolicitationProfileKey)}
          >
            {SOLICITATION_PROFILE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label>
            Agency
            <input
              value={input.agency}
              onChange={(event) => setInput((current) => ({ ...current, agency: event.target.value }))}
            />
          </label>

          <label>
            Program
            <input
              list="new-project-program-options"
              value={input.program}
              onChange={(event) => setInput((current) => ({ ...current, program: event.target.value }))}
            />
            <datalist id="new-project-program-options">
              {programOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label>
            Phase
            <input
              list="new-project-phase-options"
              value={input.phase}
              onChange={(event) => setInput((current) => ({ ...current, phase: event.target.value }))}
            />
            <datalist id="new-project-phase-options">
              {phaseOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label>
            Topic ID
            <input
              value={input.topicId}
              onChange={(event) => setInput((current) => ({ ...current, topicId: event.target.value }))}
              placeholder="AF26.1-123"
            />
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
