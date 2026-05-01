import { SlidersHorizontal } from "lucide-react";
import { SOLICITATION_PROFILE_OPTIONS, getSolicitationProfile } from "../data/solicitationProfiles";
import { Project, SolicitationProfileKey } from "../types";
import { applySolicitationProfile, sanitizeSubmissionNumber } from "../utils/projectProfile";

type ProjectProfilePanelProps = {
  project: Project;
  onUpdateProject: (project: Project) => void;
};

const programOptions = ["SBIR", "STTR", "SBIR/STTR", "BAA", "Other"];
const phaseOptions = ["Phase I", "Phase II", "Direct to Phase II", "Other"];

export const ProjectProfilePanel = ({ project, onUpdateProject }: ProjectProfilePanelProps) => {
  const profile = getSolicitationProfile(project.solicitationProfile);

  const updateProjectField = <Key extends keyof Project>(key: Key, value: Project[Key]) => {
    onUpdateProject({
      ...project,
      [key]: value,
    });
  };

  const updateTopicId = (topicId: string) => {
    const shouldSyncSolicitationNumber =
      !project.solicitationNumber.trim() || project.solicitationNumber.trim() === project.topicId.trim();

    onUpdateProject({
      ...project,
      topicId,
      solicitationNumber: shouldSyncSolicitationNumber ? topicId : project.solicitationNumber,
    });
  };

  const updateProfile = (solicitationProfile: SolicitationProfileKey) => {
    onUpdateProject(applySolicitationProfile(project, solicitationProfile));
  };

  const updateSubmissionNumber = (value: number, key: "pageLimit" | "wordLimit") => {
    onUpdateProject({
      ...project,
      submissionRequirements: {
        ...project.submissionRequirements,
        [key]: sanitizeSubmissionNumber(value),
      },
    });
  };

  return (
    <div className="profile-panel">
      <section className="builder-panel profile-editor-panel">
        <header className="profile-editor-header">
          <div>
            <p className="eyebrow">Proposal profile</p>
            <h2>{project.name}</h2>
          </div>
          <span className="status-pill">{profile.label}</span>
        </header>

        <div className="profile-grid profile-editor-grid">
          <label>
            Project name
            <input value={project.name} onChange={(event) => updateProjectField("name", event.target.value)} />
          </label>

          <label>
            Solicitation profile
            <select value={project.solicitationProfile} onChange={(event) => updateProfile(event.target.value as SolicitationProfileKey)}>
              {SOLICITATION_PROFILE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Agency
            <input value={project.agency} onChange={(event) => updateProjectField("agency", event.target.value)} />
          </label>

          <label>
            Program
            <input
              list="proposal-program-options"
              value={project.program}
              onChange={(event) => updateProjectField("program", event.target.value)}
            />
            <datalist id="proposal-program-options">
              {programOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label>
            Phase
            <input
              list="proposal-phase-options"
              value={project.phase}
              onChange={(event) => updateProjectField("phase", event.target.value)}
            />
            <datalist id="proposal-phase-options">
              {phaseOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label>
            Topic ID
            <input value={project.topicId} onChange={(event) => updateTopicId(event.target.value)} placeholder="AF26.1-123" />
          </label>

          <label>
            Solicitation number
            <input
              value={project.solicitationNumber}
              onChange={(event) => updateProjectField("solicitationNumber", event.target.value)}
              placeholder="AF26.1-123 / BAA number"
            />
          </label>

          <label>
            Release date
            <input type="date" value={project.releaseDate} onChange={(event) => updateProjectField("releaseDate", event.target.value)} />
          </label>

          <label>
            Open date
            <input type="date" value={project.openDate} onChange={(event) => updateProjectField("openDate", event.target.value)} />
          </label>

          <label>
            Close date
            <input type="date" value={project.closeDate} onChange={(event) => updateProjectField("closeDate", event.target.value)} />
          </label>

          <label>
            Due date
            <input type="date" value={project.dueDate} onChange={(event) => updateProjectField("dueDate", event.target.value)} />
          </label>

          <label>
            Page limit
            <input
              type="number"
              min={0}
              value={project.submissionRequirements.pageLimit}
              onChange={(event) => updateSubmissionNumber(Number(event.target.value), "pageLimit")}
            />
          </label>

          <label>
            Word warning
            <input
              type="number"
              min={0}
              value={project.submissionRequirements.wordLimit}
              onChange={(event) => updateSubmissionNumber(Number(event.target.value), "wordLimit")}
            />
          </label>
        </div>

        <label className="custom-instructions profile-custom-instructions">
          Custom solicitation instructions
          <textarea
            value={project.customSolicitationInstructions}
            onChange={(event) => updateProjectField("customSolicitationInstructions", event.target.value)}
            placeholder="Paste profile-specific instructions, submission rules, evaluation criteria, or agency notes."
          />
        </label>
      </section>

      <section className="builder-panel profile-reference-panel">
        <header>
          <SlidersHorizontal size={18} />
          <div>
            <p className="eyebrow">Current profile logic</p>
            <h3>{profile.label}</h3>
          </div>
        </header>
        <div className="profile-notes-grid profile-reference-grid">
          <section>
            <h3>Writing stance</h3>
            <p>{profile.suggestedTone}</p>
            <p>{profile.transitionEmphasis}</p>
          </section>
          <section>
            <h3>Evaluation emphasis</h3>
            <ul className="compact-list">
              {profile.evaluationEmphasis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Compliance checks</h3>
            <ul className="compact-list">
              {profile.complianceChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Submission notes</h3>
            <ul className="compact-list">
              {project.submissionRequirements.notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {project.submissionRequirements.attachments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
};
