import { ArrowRight, FilePlus2, FolderOpen, Gauge, ShieldCheck } from "lucide-react";
import { Project } from "../types";

type DashboardProps = {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
};

const formatDate = (value: string) => {
  if (!value) return "No due date";

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const filledSections = (project: Project) => project.sections.filter((section) => section.content.trim()).length;

export const Dashboard = ({ projects, onCreateProject, onSelectProject }: DashboardProps) => {
  const evaluatedCount = projects.filter((project) => project.evaluation).length;
  const avgScore = evaluatedCount
    ? Math.round(
        projects.reduce((sum, project) => sum + (project.evaluation?.readinessScore ?? 0), 0) / evaluatedCount,
      )
    : 0;

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">Logged-in workspace</p>
          <h1>SBIR/STTR Proposal Studio</h1>
        </div>
        <button className="button primary" type="button" onClick={onCreateProject}>
          <FilePlus2 size={18} />
          New Project
        </button>
      </header>

      <section className="metric-grid" aria-label="Workspace summary">
        <div className="metric">
          <FolderOpen size={20} />
          <span>{projects.length}</span>
          <p>Local projects</p>
        </div>
        <div className="metric">
          <ShieldCheck size={20} />
          <span>{evaluatedCount}</span>
          <p>Evaluated drafts</p>
        </div>
        <div className="metric">
          <Gauge size={20} />
          <span>{avgScore || "--"}</span>
          <p>Avg readiness</p>
        </div>
      </section>

      <section className="section-heading">
        <h2>Projects</h2>
        <p>Saved locally in this browser.</p>
      </section>

      {projects.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <button
              className="project-card"
              type="button"
              key={project.id}
              onClick={() => onSelectProject(project.id)}
            >
              <div>
                <span className="status-pill">{project.program}</span>
                <h3>{project.name}</h3>
                <p>
                  {project.agency} {project.topicId ? `• ${project.topicId}` : ""}
                </p>
              </div>
              <dl className="project-card-meta">
                <div>
                  <dt>Due</dt>
                  <dd>{formatDate(project.dueDate)}</dd>
                </div>
                <div>
                  <dt>Builder</dt>
                  <dd>{filledSections(project)}/8 sections</dd>
                </div>
                <div>
                  <dt>Score</dt>
                  <dd>{project.evaluation ? project.evaluation.readinessScore : "--"}</dd>
                </div>
              </dl>
              <span className="open-project">
                Open
                <ArrowRight size={16} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FilePlus2 size={32} />
          <h2>Create your first project</h2>
          <p>Start with solicitation text, a draft technical volume, or both.</p>
          <button className="button primary" type="button" onClick={onCreateProject}>
            <FilePlus2 size={18} />
            New Project
          </button>
        </div>
      )}
    </div>
  );
};
