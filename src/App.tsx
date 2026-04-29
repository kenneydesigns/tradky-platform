import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal } from "./components/NewProjectModal";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { createProject, loadProjects, saveProjects, touchProject } from "./services/projectStore";
import { Project, ProjectInput } from "./types";

const App = () => {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => loadProjects()[0]?.id ?? null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(projects.length === 0);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const handleCreateProject = (input: ProjectInput) => {
    const project = createProject(input);
    setProjects((current) => [project, ...current]);
    setSelectedProjectId(project.id);
    setIsNewProjectOpen(false);
  };

  const handleUpdateProject = (project: Project) => {
    const updated = touchProject(project);
    setProjects((current) =>
      current
        .map((existing) => (existing.id === updated.id ? updated : existing))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (selectedProjectId === projectId) {
      const nextProject = projects.find((project) => project.id !== projectId);
      setSelectedProjectId(nextProject?.id ?? null);
    }
  };

  return (
    <div className="app-shell">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onCreateProject={() => setIsNewProjectOpen(true)}
        onSelectProject={setSelectedProjectId}
      />

      <main className="main-surface">
        {selectedProject ? (
          <ProjectWorkspace
            project={selectedProject}
            onBackToDashboard={() => setSelectedProjectId(null)}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        ) : (
          <Dashboard
            projects={projects}
            onCreateProject={() => setIsNewProjectOpen(true)}
            onSelectProject={setSelectedProjectId}
          />
        )}
      </main>

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default App;
