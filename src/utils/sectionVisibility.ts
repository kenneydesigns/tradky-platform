import { getSectionStatusesForProfile } from "../data/solicitationProfiles";
import { Project, VolumeSection, VolumeSectionKey, VolumeSectionStatus } from "../types";

export type TechnicalVolumeExportOptions = {
  includeHiddenSavedSections?: boolean;
};

export const getProjectSectionStatuses = (project: Project): Record<VolumeSectionKey, VolumeSectionStatus> =>
  getSectionStatusesForProfile(project.solicitationProfile, project.sectionStatuses);

export const getProjectSectionStatus = (project: Project, sectionKey: VolumeSectionKey) =>
  getProjectSectionStatuses(project)[sectionKey];

export const isSectionVisible = (project: Project, sectionKey: VolumeSectionKey) =>
  getProjectSectionStatus(project, sectionKey) !== "hidden";

export const getProjectVisibleSections = (project: Project): VolumeSection[] => {
  const statuses = getProjectSectionStatuses(project);
  return project.sections.filter((section) => statuses[section.key] !== "hidden");
};

export const getProjectRequiredSectionKeys = (project: Project): VolumeSectionKey[] => {
  const statuses = getProjectSectionStatuses(project);
  return project.sections.filter((section) => statuses[section.key] === "required").map((section) => section.key);
};

export const getProjectOptionalSectionKeys = (project: Project): VolumeSectionKey[] => {
  const statuses = getProjectSectionStatuses(project);
  return project.sections.filter((section) => statuses[section.key] === "optional").map((section) => section.key);
};

// Technical-volume exports normally follow the visible profile sections only.
// When the user opts in, hidden sections are included only if they already hold saved content.
export const getProjectExportSections = (
  project: Project,
  options: TechnicalVolumeExportOptions = {},
): VolumeSection[] => {
  const statuses = getProjectSectionStatuses(project);

  return project.sections.filter((section) => {
    if (statuses[section.key] !== "hidden") return true;
    return Boolean(options.includeHiddenSavedSections && section.content.trim());
  });
};
