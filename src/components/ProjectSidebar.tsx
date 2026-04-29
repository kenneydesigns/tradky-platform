import { FilePlus2, LayoutDashboard, LockKeyhole, Sparkles } from "lucide-react";
import { Project } from "../types";

type ProjectSidebarProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onCreateProject: () => void;
  onSelectProject: (projectId: string | null) => void;
};

export const ProjectSidebar = ({
  projects,
  selectedProjectId,
  onCreateProject,
  onSelectProject,
}: ProjectSidebarProps) => (
  <aside className="sidebar">
    <div className="brand-lockup">
      <span className="brand-mark">
        <Sparkles size={20} />
      </span>
      <div>
        <strong>Proposal Studio</strong>
        <p>SBIR/STTR MVP</p>
      </div>
    </div>

    <button
      className={`sidebar-link ${selectedProjectId === null ? "active" : ""}`}
      type="button"
      onClick={() => onSelectProject(null)}
    >
      <LayoutDashboard size={18} />
      Dashboard
    </button>

    <button className="button sidebar-action" type="button" onClick={onCreateProject}>
      <FilePlus2 size={18} />
      New Project
    </button>

    <div className="sidebar-section">
      <p>Projects</p>
      <div className="sidebar-project-list">
        {projects.map((project) => (
          <button
            className={`sidebar-project ${selectedProjectId === project.id ? "active" : ""}`}
            type="button"
            key={project.id}
            onClick={() => onSelectProject(project.id)}
          >
            <span>{project.name}</span>
            <small>{project.topicId || project.phase}</small>
          </button>
        ))}
      </div>
    </div>

    <div className="embed-note">
      <LockKeyhole size={16} />
      <span>Ready for protected iframe embedding.</span>
    </div>
  </aside>
);
