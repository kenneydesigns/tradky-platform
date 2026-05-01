import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileDown,
  Gauge,
  Lightbulb,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  WandSparkles,
  XCircle,
} from "lucide-react";
import {
  ComplianceStatus,
  Project,
  SectionSuggestion,
  SolicitationProfileKey,
  VolumeSection,
  VolumeSectionKey,
  VolumeSectionStatus,
} from "../types";
import { SOLICITATION_PROFILE_OPTIONS, getSectionStatusesForProfile, getSolicitationProfile } from "../data/solicitationProfiles";
import { draftVolumeSections, implementSectionSuggestions, suggestVolumeSections } from "../services/aiClient";
import { exportDocx, exportEvaluationReportDocx, exportEvaluationReportMarkdown, exportMarkdown } from "../utils/exporters";
import { analyzeCrossSectionAlignment } from "../utils/alignmentChecker";
import { analyzeProposalCompliance } from "../utils/complianceChecker";
import { scoreProposalEvaluator } from "../utils/evaluatorScoring";
import { analyzeSectionStrength, SectionStrength } from "../utils/sectionStrength";
import {
  getProjectOptionalSectionKeys,
  getProjectRequiredSectionKeys,
  getProjectSectionStatuses,
  getProjectVisibleSections,
} from "../utils/sectionVisibility";

type VolumeBuilderProps = {
  project: Project;
  onUpdateProject: (project: Project) => void;
};

type RewritePreview = {
  key: VolumeSectionKey;
  title: string;
  before: string;
  after: string;
  selectedSuggestions: string[];
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const scoreTone = (score: number) => {
  if (score >= 82) return "strong";
  if (score >= 62) return "solid";
  if (score >= 38) return "developing";
  return "weak";
};

const evaluatorScoreLabel = (score: number) => {
  if (score >= 85) return "Strong evaluator confidence";
  if (score >= 70) return "Developing evaluator confidence";
  return "Low evaluator confidence";
};

const complianceTone = (status: ComplianceStatus) => {
  if (status === "Pass") return "pass";
  if (status === "Warning") return "warning";
  if (status === "High Risk") return "risk";
  return "non-compliant";
};

const createCompletenessMap = (sections: VolumeSection[]) =>
  sections.reduce(
    (map, section) => ({
      ...map,
      [section.key]: analyzeSectionStrength(section),
    }),
    {} as Record<VolumeSectionKey, SectionStrength>,
  );

const averageScore = (scores: number[]) => {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

const sectionStatusLabel = (status: VolumeSectionStatus) => {
  if (status === "required") return "Required";
  if (status === "optional") return "Optional";
  return "Hidden";
};

const buildProjectAssessments = (project: Project) => {
  const completenessMap = createCompletenessMap(project.sections);
  const completenessKeys = getProjectRequiredSectionKeys(project);
  const scoredKeys = completenessKeys.length ? completenessKeys : getProjectVisibleSections(project).map((section) => section.key);
  const requiredCompleteness = scoredKeys.map((key) => completenessMap[key]?.score ?? 0);
  const evaluatorAssessment = scoreProposalEvaluator(project);
  const compliance = analyzeProposalCompliance(project);

  return {
    ...project,
    completenessScore: averageScore(requiredCompleteness),
    evaluatorScore: evaluatorAssessment.overallScore,
    complianceFindings: compliance.findings,
  };
};

export const VolumeBuilder = ({ project, onUpdateProject }: VolumeBuilderProps) => {
  const [activeKey, setActiveKey] = useState<VolumeSectionKey>(project.sections[0].key);
  const [draftingTarget, setDraftingTarget] = useState<"empty" | VolumeSectionKey | null>(null);
  const [suggestingTarget, setSuggestingTarget] = useState<"all" | VolumeSectionKey | null>(null);
  const [implementingTarget, setImplementingTarget] = useState<VolumeSectionKey | null>(null);
  const [suggestionsByKey, setSuggestionsByKey] = useState<Partial<Record<VolumeSectionKey, SectionSuggestion>>>({});
  const [selectedSuggestionIndexesByKey, setSelectedSuggestionIndexesByKey] = useState<Partial<Record<VolumeSectionKey, number[]>>>({});
  const [rewritePreview, setRewritePreview] = useState<RewritePreview | null>(null);
  const [includeHiddenSavedSections, setIncludeHiddenSavedSections] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [suggestionError, setSuggestionError] = useState("");
  const [rewriteError, setRewriteError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const profile = useMemo(() => getSolicitationProfile(project.solicitationProfile), [project.solicitationProfile]);
  const sectionStatuses = useMemo(() => getProjectSectionStatuses(project), [project]);
  const visibleSections = useMemo(() => getProjectVisibleSections(project), [project]);
  const requiredSectionKeys = useMemo(() => getProjectRequiredSectionKeys(project), [project]);
  const optionalSectionKeys = useMemo(() => getProjectOptionalSectionKeys(project), [project]);
  const hiddenSectionCount = project.sections.length - visibleSections.length;
  const hiddenSavedSectionCount = project.sections.filter(
    (section) => sectionStatuses[section.key] === "hidden" && section.content.trim(),
  ).length;
  const activeSection = visibleSections.find((section) => section.key === activeKey) ?? visibleSections[0] ?? project.sections[0];
  const activeSuggestion = suggestionsByKey[activeSection.key];
  const compliance = useMemo(() => analyzeProposalCompliance(project), [project]);
  const evaluatorAssessment = useMemo(() => scoreProposalEvaluator(project), [project]);
  const alignmentFindings = useMemo(() => analyzeCrossSectionAlignment(project), [project]);
  const activeSectionScore = evaluatorAssessment.sectionScores.find((section) => section.key === activeSection.key);

  const totalWords = useMemo(
    () => visibleSections.reduce((sum, section) => sum + countWords(section.content), 0),
    [visibleSections],
  );
  const sectionCompleteness = useMemo(() => createCompletenessMap(project.sections), [project.sections]);
  const evaluatorScore = activeSuggestion?.evaluatorScore ?? activeSectionScore?.score;
  const displayEvaluatorScore = evaluatorScore ?? 0;
  const activeSuggestionItems = activeSuggestion?.suggestions ?? [];
  const selectedSuggestionIndexes = (selectedSuggestionIndexesByKey[activeSection.key] ?? []).filter(
    (index) => index >= 0 && index < activeSuggestionItems.length,
  );
  const selectedSuggestionTexts = selectedSuggestionIndexes
    .map((index) => activeSuggestionItems[index])
    .filter((suggestion): suggestion is string => Boolean(suggestion));
  const allActiveSuggestionsSelected =
    activeSuggestionItems.length > 0 && selectedSuggestionIndexes.length === activeSuggestionItems.length;
  const activeRewritePreview = rewritePreview?.key === activeSection.key ? rewritePreview : null;
  const emptySectionKeys = useMemo(
    () => visibleSections.filter((section) => !section.content.trim()).map((section) => section.key),
    [visibleSections],
  );

  useEffect(() => {
    if (visibleSections.some((section) => section.key === activeKey)) return;
    const nextActiveKey = visibleSections[0]?.key ?? project.sections[0]?.key;
    if (nextActiveKey) setActiveKey(nextActiveKey);
  }, [activeKey, project.sections, visibleSections]);

  const commitProject = (nextProject: Project) => {
    onUpdateProject(buildProjectAssessments(nextProject));
  };

  const resetImplementationState = (sectionKeys: VolumeSectionKey[]) => {
    setSelectedSuggestionIndexesByKey((current) => {
      const next = { ...current };
      sectionKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    setRewritePreview((current) => (current && sectionKeys.includes(current.key) ? null : current));
    setRewriteError("");
    setCopyStatus("");
  };

  const clearSuggestions = (sectionKeys: VolumeSectionKey[]) => {
    setSuggestionsByKey((current) => {
      const next = { ...current };
      sectionKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    resetImplementationState(sectionKeys);
  };

  const updateSection = (section: VolumeSection, content: string) => {
    clearSuggestions([section.key]);
    commitProject({
      ...project,
      sections: project.sections.map((existing) => (existing.key === section.key ? { ...existing, content } : existing)),
    });
  };

  const applySectionDrafts = (draftedSections: VolumeSection[]) => {
    const draftByKey = new Map(draftedSections.map((section) => [section.key, section.content]));
    clearSuggestions(draftedSections.map((section) => section.key));

    commitProject({
      ...project,
      sections: project.sections.map((section) => ({
        ...section,
        content: draftByKey.get(section.key) ?? section.content,
      })),
    });
  };

  const draftSections = async (sectionKeys: VolumeSectionKey[], target: "empty" | VolumeSectionKey) => {
    if (!sectionKeys.length) return;

    setDraftingTarget(target);
    setDraftError("");

    try {
      const result = await draftVolumeSections({ project, sectionKeys });
      applySectionDrafts(result.sections);
    } catch (caught) {
      setDraftError(caught instanceof Error ? caught.message : "Section drafting failed");
    } finally {
      setDraftingTarget(null);
    }
  };

  const requestSuggestions = async (sectionKeys: VolumeSectionKey[], target: "all" | VolumeSectionKey) => {
    if (!sectionKeys.length) return;

    setSuggestingTarget(target);
    setSuggestionError("");

    try {
      const result = await suggestVolumeSections({ project, sectionKeys });
      const returnedKeys = result.sections.map((section) => section.key);
      resetImplementationState(returnedKeys);
      setSuggestionsByKey((current) => ({
        ...current,
        ...Object.fromEntries(result.sections.map((section) => [section.key, section])),
      }));
    } catch (caught) {
      setSuggestionError(caught instanceof Error ? caught.message : "Section suggestions failed");
    } finally {
      setSuggestingTarget(null);
    }
  };

  const draftEmptySections = () => {
    void draftSections(emptySectionKeys, "empty");
  };

  const draftActiveSection = () => {
    void draftSections([activeSection.key], activeSection.key);
  };

  const refreshAllSuggestions = () => {
    void requestSuggestions(
      visibleSections.map((section) => section.key),
      "all",
    );
  };

  const refreshActiveSuggestions = () => {
    void requestSuggestions([activeSection.key], activeSection.key);
  };

  const updateSuggestionSelection = (sectionKey: VolumeSectionKey, suggestionIndex: number, isSelected: boolean) => {
    setSelectedSuggestionIndexesByKey((current) => {
      const currentIndexes = current[sectionKey] ?? [];
      const nextIndexes = isSelected
        ? [...new Set([...currentIndexes, suggestionIndex])].sort((a, b) => a - b)
        : currentIndexes.filter((index) => index !== suggestionIndex);

      return {
        ...current,
        [sectionKey]: nextIndexes,
      };
    });
    setRewritePreview((current) => (current?.key === sectionKey ? null : current));
    setRewriteError("");
    setCopyStatus("");
  };

  const selectAllActiveSuggestions = () => {
    if (!activeSuggestionItems.length) return;
    setSelectedSuggestionIndexesByKey((current) => ({
      ...current,
      [activeSection.key]: activeSuggestionItems.map((_, index) => index),
    }));
    setRewritePreview((current) => (current?.key === activeSection.key ? null : current));
    setRewriteError("");
    setCopyStatus("");
  };

  const clearActiveSuggestionSelection = () => {
    setSelectedSuggestionIndexesByKey((current) => ({
      ...current,
      [activeSection.key]: [],
    }));
    setRewritePreview((current) => (current?.key === activeSection.key ? null : current));
    setRewriteError("");
    setCopyStatus("");
  };

  const requestSuggestionImplementation = async () => {
    if (!activeSuggestion || !selectedSuggestionTexts.length) return;

    const sectionSnapshot = activeSection;
    setImplementingTarget(sectionSnapshot.key);
    setRewriteError("");
    setCopyStatus("");

    try {
      const result = await implementSectionSuggestions({
        project,
        sectionKey: sectionSnapshot.key,
        selectedSuggestions: selectedSuggestionTexts,
      });
      setRewritePreview({
        key: sectionSnapshot.key,
        title: sectionSnapshot.title,
        before: sectionSnapshot.content,
        after: result.section.content,
        selectedSuggestions: result.selectedSuggestions,
      });
    } catch (caught) {
      setRewriteError(caught instanceof Error ? caught.message : "Section rewrite failed");
    } finally {
      setImplementingTarget(null);
    }
  };

  const acceptRewrite = () => {
    if (!activeRewritePreview) return;
    updateSection(activeSection, activeRewritePreview.after);
    setRewritePreview(null);
    setCopyStatus("");
  };

  const rejectRewrite = () => {
    setRewritePreview(null);
    setCopyStatus("");
  };

  const copyRewrite = async () => {
    if (!activeRewritePreview) return;

    try {
      await navigator.clipboard.writeText(activeRewritePreview.after);
      setCopyStatus("Rewrite copied.");
    } catch {
      setCopyStatus("Copy failed. Select the rewrite text and copy it manually.");
    }
  };

  const updateProfile = (solicitationProfile: SolicitationProfileKey) => {
    const nextProfile = getSolicitationProfile(solicitationProfile);
    const nextStatuses =
      nextProfile.key === "customMultiAgency"
        ? getSectionStatusesForProfile(nextProfile.key, project.sectionStatuses)
        : getSectionStatusesForProfile(nextProfile.key);

    commitProject({
      ...project,
      solicitationProfile: nextProfile.key,
      agency: nextProfile.agency,
      program: nextProfile.program,
      submissionRequirements: nextProfile.submissionRequirements,
      evaluationWeights: nextProfile.evaluationWeights,
      sectionStatuses: nextStatuses,
    });
  };

  const updateSectionStatus = (sectionKey: VolumeSectionKey, status: VolumeSectionStatus) => {
    const nextStatuses = {
      ...sectionStatuses,
      [sectionKey]: status,
    };
    const hasVisibleSection = project.sections.some((section) => nextStatuses[section.key] !== "hidden");

    if (!hasVisibleSection) return;

    commitProject({
      ...project,
      sectionStatuses: nextStatuses,
    });
  };

  const updateProjectField = <Key extends keyof Project>(key: Key, value: Project[Key]) => {
    commitProject({
      ...project,
      [key]: value,
    });
  };

  const updateSubmissionNumber = (value: number, key: "pageLimit" | "wordLimit") => {
    commitProject({
      ...project,
      submissionRequirements: {
        ...project.submissionRequirements,
        [key]: Number.isFinite(value) && value >= 0 ? value : 0,
      },
    });
  };

  return (
    <div className="builder">
      <header className="builder-toolbar">
        <div>
          <p className="eyebrow">Technical volume builder</p>
          <h2>
            {totalWords} words across {visibleSections.length} visible sections
          </h2>
          {hiddenSectionCount ? <small>{hiddenSectionCount} profile-hidden sections remain saved.</small> : null}
        </div>
        <div className="toolbar-actions">
          <button
            className="button"
            type="button"
            disabled={!emptySectionKeys.length || draftingTarget !== null}
            onClick={draftEmptySections}
          >
            <WandSparkles size={17} />
            {draftingTarget === "empty" ? "Drafting..." : "AI Draft Empty Sections"}
          </button>
          <button className="button" type="button" disabled={suggestingTarget !== null} onClick={refreshAllSuggestions}>
            <Lightbulb size={17} />
            {suggestingTarget === "all" ? "Reviewing..." : "Evaluator Suggestions"}
          </button>
          <label className="export-hidden-toggle">
            <input
              type="checkbox"
              checked={includeHiddenSavedSections}
              disabled={!hiddenSavedSectionCount}
              onChange={(event) => setIncludeHiddenSavedSections(event.target.checked)}
            />
            Include hidden saved sections
          </label>
          <button
            className="button"
            type="button"
            onClick={() => exportMarkdown(project, { includeHiddenSavedSections })}
          >
            <Download size={17} />
            Volume MD
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => void exportDocx(project, { includeHiddenSavedSections })}
          >
            <FileDown size={17} />
            Volume DOCX
          </button>
        </div>
      </header>

      {draftError ? <div className="error-banner">{draftError}</div> : null}
      {suggestionError ? <div className="error-banner">{suggestionError}</div> : null}

      <details className="builder-panel solicitation-panel" open>
        <summary>
          <span>
            <SlidersHorizontal size={18} />
            Proposal profile
          </span>
          <strong>{profile.label}</strong>
          <ChevronDown size={18} />
        </summary>
        <div className="profile-grid">
          <label>
            Proposal profile
            <select
              value={project.solicitationProfile}
              onChange={(event) => updateProfile(event.target.value as SolicitationProfileKey)}
            >
              {SOLICITATION_PROFILE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
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
            Agency
            <input value={project.agency} onChange={(event) => updateProjectField("agency", event.target.value)} />
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
            <input
              type="date"
              value={project.closeDate}
              onChange={(event) => updateProjectField("closeDate", event.target.value)}
            />
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
        <div className="profile-notes-grid">
          <section>
            <h3>Section profile</h3>
            <p>{profile.suggestedTone}</p>
            <p>{profile.transitionEmphasis}</p>
            <h4>Required</h4>
            <div className="profile-chip-list">
              {requiredSectionKeys.map((key) => (
                <span key={key}>{project.sections.find((section) => section.key === key)?.title ?? key}</span>
              ))}
            </div>
            <h4>Optional</h4>
            <div className="profile-chip-list">
              {optionalSectionKeys.map((key) => (
                <span key={key}>{project.sections.find((section) => section.key === key)?.title ?? key}</span>
              ))}
            </div>
          </section>
          <section>
            <h3>Evaluation emphasis</h3>
            <ul className="compact-list">
              {profile.evaluationEmphasis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Compliance checks</h3>
            <ul className="compact-list">
              {profile.complianceChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Evaluation weights</h3>
            <div className="weight-grid">
              {Object.entries(project.evaluationWeights).map(([key, value]) => (
                <span key={key}>
                  {key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} <strong>{value}%</strong>
                </span>
              ))}
            </div>
          </section>
          <label className="custom-instructions">
            Custom solicitation instructions
            <textarea
              value={project.customSolicitationInstructions}
              onChange={(event) => updateProjectField("customSolicitationInstructions", event.target.value)}
              placeholder="Paste profile-specific instructions, submission rules, evaluation criteria, or agency notes."
            />
          </label>
        </div>
        {profile.key === "customMultiAgency" ? (
          <section className="custom-section-controls" aria-label="Custom section controls">
            <div>
              <h3>Custom section visibility</h3>
              <p>Set each saved section as required, optional, or hidden for this project.</p>
            </div>
            <div className="custom-section-grid">
              {project.sections.map((section) => {
                const status = sectionStatuses[section.key];
                const disableHidden = status !== "hidden" && visibleSections.length <= 1;

                return (
                  <article key={section.key}>
                    <div>
                      <strong>{section.title}</strong>
                      <small>{countWords(section.content)} saved words</small>
                    </div>
                    <div className="segmented-control" aria-label={`${section.title} status`}>
                      {(["required", "optional", "hidden"] as VolumeSectionStatus[]).map((nextStatus) => (
                        <button
                          className={status === nextStatus ? "active" : ""}
                          type="button"
                          key={nextStatus}
                          disabled={nextStatus === "hidden" && disableHidden}
                          aria-pressed={status === nextStatus}
                          onClick={() => updateSectionStatus(section.key, nextStatus)}
                        >
                          {sectionStatusLabel(nextStatus)}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </details>

      <div className="builder-panel-grid">
        <details className="builder-panel compliance-panel" open>
          <summary>
            <span>
              <ShieldCheck size={18} />
              Compliance checker
            </span>
            <strong className={`status-badge ${complianceTone(compliance.overallStatus)}`}>{compliance.overallStatus}</strong>
            <ChevronDown size={18} />
          </summary>
          <div className="compliance-summary-row">
            {(["Pass", "Warning", "High Risk", "Non-Compliant"] as ComplianceStatus[]).map((status) => (
              <span key={status} className={`status-badge ${complianceTone(status)}`}>
                {status}: {compliance.counts[status]}
              </span>
            ))}
          </div>
          <div className="finding-list">
            {compliance.findings.map((finding) => (
              <article key={finding.id}>
                <div>
                  {finding.status === "Pass" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <strong>{finding.title}</strong>
                </div>
                <span className={`status-badge ${complianceTone(finding.status)}`}>{finding.status}</span>
                <p>{finding.detail}</p>
                <small>{finding.recommendation}</small>
              </article>
            ))}
          </div>
        </details>

        <details className="builder-panel scoring-panel" open>
          <summary>
            <span>
              <Gauge size={18} />
              Evaluator scoring
            </span>
            <strong>{evaluatorAssessment.overallScore}%</strong>
            <ChevronDown size={18} />
          </summary>
          <div className="score-export-row">
            <div>
              <p className="eyebrow">Overall evaluator score</p>
              <strong>{evaluatorAssessment.overallScore}%</strong>
              <span>{evaluatorScoreLabel(evaluatorAssessment.overallScore)}</span>
            </div>
            <button className="button compact" type="button" onClick={() => exportEvaluationReportMarkdown(project)}>
              <Download size={16} />
              Report MD
            </button>
            <button className="button compact primary" type="button" onClick={() => void exportEvaluationReportDocx(project)}>
              <FileDown size={16} />
              Report DOCX
            </button>
          </div>
          <div className="section-score-list">
            {evaluatorAssessment.sectionScores.map((sectionScore) => (
              <button
                className={sectionScore.key === activeSection.key ? "active" : ""}
                type="button"
                key={sectionScore.key}
                onClick={() => setActiveKey(sectionScore.key)}
              >
                <span>{sectionScore.title}</span>
                <strong>{sectionScore.score}%</strong>
                <div className="strength-meter" aria-label={`${sectionScore.title} evaluator score ${sectionScore.score}%`}>
                  <span className={scoreTone(sectionScore.score)} style={{ width: `${sectionScore.score}%` }} />
                </div>
              </button>
            ))}
          </div>
          <div className="scoring-details">
            <section>
              <h3>Major strengths</h3>
              <ul>
                {evaluatorAssessment.majorStrengths.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Major weaknesses</h3>
              <ul>
                {evaluatorAssessment.majorWeaknesses.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Recommended fixes</h3>
              <ul>
                {evaluatorAssessment.recommendedFixes.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </details>

        <details className="builder-panel alignment-panel">
          <summary>
            <span>
              <ScanSearch size={18} />
              Cross-section alignment
            </span>
            <strong>{alignmentFindings.filter((finding) => finding.status !== "Aligned").length} flags</strong>
            <ChevronDown size={18} />
          </summary>
          <div className="finding-list compact">
            {alignmentFindings.map((finding) => (
              <article key={finding.id}>
                <div>
                  {finding.status === "Aligned" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <strong>{finding.title}</strong>
                </div>
                <span className={`status-badge ${finding.status === "Aligned" ? "pass" : finding.status === "Warning" ? "warning" : "risk"}`}>
                  {finding.status}
                </span>
                <p>{finding.detail}</p>
                <small>{finding.recommendation}</small>
              </article>
            ))}
          </div>
        </details>
      </div>

      <div className="builder-layout">
        <nav className="section-nav" aria-label="Technical volume sections">
          <div className="section-nav-heading">
            <span>Completeness</span>
            <small>Draft coverage, not evaluator score</small>
          </div>
          {visibleSections.map((section) => {
            const completeness = sectionCompleteness[section.key];
            const status = sectionStatuses[section.key];

            return (
              <button
                className={section.key === activeSection.key ? "active" : ""}
                type="button"
                key={section.key}
                onClick={() => setActiveKey(section.key)}
              >
                <div className="section-nav-row">
                  <span>
                    {section.title}
                    <small className={`section-status-tag ${status}`}>{sectionStatusLabel(status)}</small>
                  </span>
                  <small>{countWords(section.content)} words</small>
                </div>
                <div className="strength-meter" aria-label={`${section.title} completeness ${completeness.score}%`}>
                  <span className={scoreTone(completeness.score)} style={{ width: `${completeness.score}%` }} />
                </div>
                <small className="strength-caption">
                  Completeness: {completeness.label} • {completeness.score}%
                </small>
              </button>
            );
          })}
        </nav>

        <section className="section-editor">
          <header>
            <div>
              <p className="eyebrow">Editable section</p>
              <h2>{activeSection.title}</h2>
            </div>
            <div className="section-editor-actions">
              <span>{countWords(activeSection.content)} words</span>
              <button
                className="button compact"
                type="button"
                disabled={suggestingTarget !== null}
                onClick={refreshActiveSuggestions}
              >
                <Lightbulb size={16} />
                {suggestingTarget === activeSection.key ? "Reviewing..." : "Evaluator Suggestions"}
              </button>
              <button className="button compact" type="button" disabled={draftingTarget !== null} onClick={draftActiveSection}>
                <WandSparkles size={16} />
                {draftingTarget === activeSection.key ? "Drafting..." : "AI Draft This Section"}
              </button>
            </div>
          </header>
          <div className="section-insights">
            <section className="strength-insight" aria-label={`${activeSection.title} evaluator score`}>
              <div className="insight-heading">
                <Gauge size={17} />
                <span>Evaluator Score</span>
                <strong>{evaluatorScore === undefined ? "Not run" : `${evaluatorScore}%`}</strong>
              </div>
              <div className="strength-meter large">
                <span className={scoreTone(displayEvaluatorScore)} style={{ width: `${displayEvaluatorScore}%` }} />
              </div>
              <p>{evaluatorScore === undefined ? "Not reviewed" : evaluatorScoreLabel(evaluatorScore)}</p>
              <small>Separate from completeness; based on solicitation fit, evidence, metrics, transition, and risk.</small>
              {activeSectionScore ? (
                <div className="criterion-list">
                  {activeSectionScore.criteria
                    .slice()
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((criterion) => (
                      <span key={criterion.key}>
                        {criterion.title} <strong>{criterion.score}%</strong>
                      </span>
                    ))}
                </div>
              ) : null}
            </section>

            <section className="ai-suggestions" aria-label={`${activeSection.title} evaluator suggestions`}>
              <div className="insight-heading">
                <Lightbulb size={17} />
                <span>Evaluator Suggestions</span>
              </div>
              {activeSuggestion ? (
                <>
                  <p>{activeSuggestion.summary}</p>
                  <dl className="reviewer-finding">
                    <div>
                      <dt>Reviewer finding</dt>
                      <dd>{activeSuggestion.reviewerFinding || activeSuggestion.summary}</dd>
                    </div>
                    <div>
                      <dt>Why it matters</dt>
                      <dd>{activeSuggestion.whyItMatters || "This limits reviewer confidence in the section's scoreable evidence."}</dd>
                    </div>
                    <div>
                      <dt>Score impact</dt>
                      <dd>{activeSuggestion.scoreImpact || "The section score may stay capped until the gap is fixed."}</dd>
                    </div>
                    <div>
                      <dt>Rewrite recommendation</dt>
                      <dd>{activeSuggestion.rewriteRecommendation || activeSuggestion.suggestions[0]}</dd>
                    </div>
                    <div>
                      <dt>Example improved language</dt>
                      <dd>
                        {activeSuggestion.improvedLanguageExample ||
                          "During Phase I, we will validate [metric] for [customer/use case] using [test method], with success defined as [threshold]."}
                      </dd>
                    </div>
                  </dl>
                  {activeSuggestionItems.length ? (
                    <section className="suggestion-implementation" aria-label="Implement These Suggestions with AI">
                      <header className="implementation-header">
                        <div>
                          <h3>Implement These Suggestions with AI</h3>
                          <p>Choose the evaluator recommendations the rewrite should apply to this section.</p>
                        </div>
                        <span>
                          {selectedSuggestionTexts.length}/{activeSuggestionItems.length} selected
                        </span>
                      </header>

                      <div className="suggestion-selection-toolbar">
                        <button
                          className="button compact"
                          type="button"
                          disabled={allActiveSuggestionsSelected}
                          onClick={selectAllActiveSuggestions}
                        >
                          <CheckCircle2 size={15} />
                          Select All
                        </button>
                        <button
                          className="button compact"
                          type="button"
                          disabled={!selectedSuggestionTexts.length}
                          onClick={clearActiveSuggestionSelection}
                        >
                          <XCircle size={15} />
                          Clear Selection
                        </button>
                      </div>

                      <div className="selectable-suggestion-list" role="group" aria-label="Evaluator suggestions to implement">
                        {activeSuggestionItems.map((suggestion, index) => {
                          const isSelected = selectedSuggestionIndexes.includes(index);

                          return (
                            <label className={isSelected ? "selected" : ""} key={`${index}-${suggestion}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(event) => updateSuggestionSelection(activeSection.key, index, event.target.checked)}
                              />
                              <span>{suggestion}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="selected-suggestion-review">
                        <div>
                          <strong>Selected suggestions to apply</strong>
                          <span>{selectedSuggestionTexts.length ? `${selectedSuggestionTexts.length} ready` : "None selected"}</span>
                        </div>
                        {selectedSuggestionTexts.length ? (
                          <ol>
                            {selectedSuggestionTexts.map((suggestion, index) => (
                              <li key={`${index}-${suggestion}`}>{suggestion}</li>
                            ))}
                          </ol>
                        ) : (
                          <p>Select one or more suggestions to review them here before asking AI for a rewrite.</p>
                        )}
                      </div>

                      {rewriteError ? <div className="inline-error">{rewriteError}</div> : null}

                      <button
                        className="button primary implement-suggestions-button"
                        type="button"
                        disabled={!selectedSuggestionTexts.length || implementingTarget !== null}
                        onClick={() => void requestSuggestionImplementation()}
                      >
                        <WandSparkles size={16} />
                        {implementingTarget === activeSection.key ? "Implementing..." : "Implement Selected Suggestions with AI"}
                      </button>

                      {activeRewritePreview ? (
                        <section className="rewrite-preview" aria-label={`${activeRewritePreview.title} before and after preview`}>
                          <header>
                            <div>
                              <h3>Before / After Preview</h3>
                              <p>Review the rewrite before replacing this section.</p>
                            </div>
                            <span>{countWords(activeRewritePreview.after)} words</span>
                          </header>
                          <div className="rewrite-preview-selected">
                            <strong>Applied suggestions</strong>
                            <ol>
                              {activeRewritePreview.selectedSuggestions.map((suggestion, index) => (
                                <li key={`${index}-${suggestion}`}>{suggestion}</li>
                              ))}
                            </ol>
                          </div>
                          <div className="rewrite-preview-grid">
                            <article>
                              <h4>Before</h4>
                              <div className="preview-text">{activeRewritePreview.before || "No original section text."}</div>
                            </article>
                            <article>
                              <h4>After</h4>
                              <div className="preview-text">{activeRewritePreview.after}</div>
                            </article>
                          </div>
                          <div className="rewrite-preview-actions">
                            <button className="button primary compact" type="button" onClick={acceptRewrite}>
                              <CheckCircle2 size={16} />
                              Accept Rewrite
                            </button>
                            <button className="button compact" type="button" onClick={rejectRewrite}>
                              <XCircle size={16} />
                              Reject Rewrite
                            </button>
                            <button className="button compact" type="button" onClick={() => void copyRewrite()}>
                              <Copy size={16} />
                              Copy Rewrite
                            </button>
                          </div>
                          {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}
                        </section>
                      ) : null}
                    </section>
                  ) : null}
                </>
              ) : (
                <p>Run evaluator suggestions to get SBIR reviewer findings for this draft.</p>
              )}
            </section>
          </div>
          <textarea
            value={activeSection.content}
            onChange={(event) => updateSection(activeSection, event.target.value)}
            disabled={draftingTarget === activeSection.key}
            placeholder={`Draft the ${activeSection.title.toLowerCase()} section.`}
          />
        </section>
      </div>
    </div>
  );
};
