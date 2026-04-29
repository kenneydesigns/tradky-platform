import { defaultVolumeSections } from "../data/volumeSections";
import { Project, ProjectInput } from "../types";

const STORAGE_KEY = "sbir-sttr-proposal-projects";

const now = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const cloneSections = () => defaultVolumeSections.map((section) => ({ ...section }));

export const createProject = (input: ProjectInput): Project => ({
  id: createId(),
  name: input.name.trim(),
  agency: input.agency.trim() || "DoD",
  program: input.program.trim() || "SBIR",
  topicId: input.topicId.trim(),
  phase: input.phase.trim() || "Phase I",
  dueDate: input.dueDate,
  createdAt: now(),
  updatedAt: now(),
  solicitationText: "",
  proposalText: "",
  evaluation: null,
  sections: cloneSections(),
});

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const projects = JSON.parse(raw) as Project[];
    return projects
      .map((project) => ({
        ...project,
        sections: project.sections?.length ? project.sections : cloneSections(),
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
};

export const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const touchProject = (project: Project): Project => ({
  ...project,
  updatedAt: now(),
});
