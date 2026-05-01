import { getSectionStatusesForProfile, getSolicitationProfile } from "../data/solicitationProfiles";
import { Project, SolicitationProfileKey } from "../types";

export const applySolicitationProfile = (project: Project, solicitationProfile: SolicitationProfileKey): Project => {
  const nextProfile = getSolicitationProfile(solicitationProfile);
  const nextStatuses =
    nextProfile.key === "customMultiAgency"
      ? getSectionStatusesForProfile(nextProfile.key, project.sectionStatuses)
      : getSectionStatusesForProfile(nextProfile.key);

  return {
    ...project,
    solicitationProfile: nextProfile.key,
    agency: nextProfile.agency,
    program: nextProfile.program,
    submissionRequirements: nextProfile.submissionRequirements,
    evaluationWeights: nextProfile.evaluationWeights,
    sectionStatuses: nextStatuses,
  };
};

export const sanitizeSubmissionNumber = (value: number) => (Number.isFinite(value) && value >= 0 ? value : 0);
