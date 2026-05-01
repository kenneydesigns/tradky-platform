import { defaultVolumeSections } from "../data/volumeSections";
import {
  DEFAULT_SOLICITATION_PROFILE_KEY,
  getProfileDefaults,
  getSectionStatusesForProfile,
  getSolicitationProfile,
} from "../data/solicitationProfiles";
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

const mergeSections = (sections: Partial<Project>["sections"]) => {
  const savedByKey = new Map((sections ?? []).map((section) => [section.key, section]));

  return defaultVolumeSections.map((section) => ({
    ...section,
    content: savedByKey.get(section.key)?.content ?? section.content,
  }));
};

const cloneRequirements = (project: Partial<Project>, profileDefaults: ReturnType<typeof getProfileDefaults>) => ({
  ...profileDefaults.submissionRequirements,
  ...project.submissionRequirements,
  attachments: project.submissionRequirements?.attachments ?? profileDefaults.submissionRequirements.attachments,
  notes: project.submissionRequirements?.notes ?? profileDefaults.submissionRequirements.notes,
});

const normalizeProject = (project: Partial<Project>): Project => {
  const profileKey = getSolicitationProfile(project.solicitationProfile).key;
  const profileDefaults = getProfileDefaults(profileKey);
  const sections = project.sections?.length ? mergeSections(project.sections) : cloneSections();
  const sectionStatuses = getSectionStatusesForProfile(profileKey, project.sectionStatuses);

  return {
    id: project.id ?? createId(),
    name: project.name?.trim() || "Untitled proposal",
    agency: project.agency?.trim() || profileDefaults.agency,
    program: project.program?.trim() || profileDefaults.program,
    topicId: project.topicId ?? "",
    solicitationProfile: profileKey,
    solicitationNumber: project.solicitationNumber ?? project.topicId ?? "",
    phase: project.phase?.trim() || "Phase I",
    dueDate: project.dueDate ?? "",
    releaseDate: project.releaseDate ?? "",
    openDate: project.openDate ?? "",
    closeDate: project.closeDate ?? project.dueDate ?? "",
    submissionRequirements: cloneRequirements(project, profileDefaults),
    evaluationWeights: {
      ...profileDefaults.evaluationWeights,
      ...project.evaluationWeights,
    },
    customSolicitationInstructions: project.customSolicitationInstructions ?? "",
    createdAt: project.createdAt ?? now(),
    updatedAt: project.updatedAt ?? now(),
    solicitationText: project.solicitationText ?? "",
    proposalText: project.proposalText ?? "",
    evaluation: project.evaluation ?? null,
    sections,
    sectionStatuses,
    completenessScore: project.completenessScore ?? 0,
    evaluatorScore: project.evaluatorScore ?? 0,
    complianceFindings: project.complianceFindings ?? [],
    exportHistory: project.exportHistory ?? [],
  };
};

export const createProject = (input: ProjectInput): Project => {
  const profileDefaults = getProfileDefaults(input.solicitationProfile ?? DEFAULT_SOLICITATION_PROFILE_KEY);

  return normalizeProject({
    id: createId(),
    name: input.name.trim(),
    agency: input.agency.trim() || profileDefaults.agency,
    program: input.program.trim() || profileDefaults.program,
    topicId: input.topicId.trim(),
    solicitationProfile: profileDefaults.solicitationProfile,
    solicitationNumber: input.solicitationNumber?.trim() || input.topicId.trim(),
    phase: input.phase.trim() || "Phase I",
    dueDate: input.dueDate,
    closeDate: input.dueDate,
    createdAt: now(),
    updatedAt: now(),
    solicitationText: "",
    proposalText: "",
    evaluation: null,
    sections: cloneSections(),
    sectionStatuses: profileDefaults.sectionStatuses,
  });
};

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const projects = JSON.parse(raw) as Project[];
    return projects
      .map(normalizeProject)
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
