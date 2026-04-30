import { useMemo, useState } from "react";
import { Download, FileDown, Gauge, Lightbulb, WandSparkles } from "lucide-react";
import { Project, SectionSuggestion, VolumeSection, VolumeSectionKey } from "../types";
import { draftVolumeSections, suggestVolumeSections } from "../services/aiClient";
import { exportDocx, exportMarkdown } from "../utils/exporters";
import { analyzeSectionStrength, SectionStrength } from "../utils/sectionStrength";

type VolumeBuilderProps = {
  project: Project;
  onUpdateProject: (project: Project) => void;
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

const createCompletenessMap = (sections: VolumeSection[]) =>
  sections.reduce(
    (map, section) => ({
      ...map,
      [section.key]: analyzeSectionStrength(section),
    }),
    {} as Record<VolumeSectionKey, SectionStrength>,
  );

export const VolumeBuilder = ({ project, onUpdateProject }: VolumeBuilderProps) => {
  const [activeKey, setActiveKey] = useState<VolumeSectionKey>(project.sections[0].key);
  const [draftingTarget, setDraftingTarget] = useState<"empty" | VolumeSectionKey | null>(null);
  const [suggestingTarget, setSuggestingTarget] = useState<"all" | VolumeSectionKey | null>(null);
  const [suggestionsByKey, setSuggestionsByKey] = useState<Partial<Record<VolumeSectionKey, SectionSuggestion>>>({});
  const [draftError, setDraftError] = useState("");
  const [suggestionError, setSuggestionError] = useState("");
  const activeSection = project.sections.find((section) => section.key === activeKey) ?? project.sections[0];
  const activeSuggestion = suggestionsByKey[activeSection.key];

  const totalWords = useMemo(
    () => project.sections.reduce((sum, section) => sum + countWords(section.content), 0),
    [project.sections],
  );
  const sectionCompleteness = useMemo(() => createCompletenessMap(project.sections), [project.sections]);
  const evaluatorScore = activeSuggestion?.evaluatorScore;
  const displayEvaluatorScore = evaluatorScore ?? 0;
  const emptySectionKeys = useMemo(
    () => project.sections.filter((section) => !section.content.trim()).map((section) => section.key),
    [project.sections],
  );

  const clearSuggestions = (sectionKeys: VolumeSectionKey[]) => {
    setSuggestionsByKey((current) => {
      const next = { ...current };
      sectionKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  };

  const updateSection = (section: VolumeSection, content: string) => {
    clearSuggestions([section.key]);
    onUpdateProject({
      ...project,
      sections: project.sections.map((existing) => (existing.key === section.key ? { ...existing, content } : existing)),
    });
  };

  const applySectionDrafts = (draftedSections: VolumeSection[]) => {
    const draftByKey = new Map(draftedSections.map((section) => [section.key, section.content]));
    clearSuggestions(draftedSections.map((section) => section.key));

    onUpdateProject({
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
      project.sections.map((section) => section.key),
      "all",
    );
  };

  const refreshActiveSuggestions = () => {
    void requestSuggestions([activeSection.key], activeSection.key);
  };

  return (
    <div className="builder">
      <header className="builder-toolbar">
        <div>
          <p className="eyebrow">Technical volume builder</p>
          <h2>{totalWords} words across 8 sections</h2>
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
          <button className="button" type="button" onClick={() => exportMarkdown(project)}>
            <Download size={17} />
            Markdown
          </button>
          <button className="button primary" type="button" onClick={() => void exportDocx(project)}>
            <FileDown size={17} />
            DOCX
          </button>
        </div>
      </header>

      {draftError ? <div className="error-banner">{draftError}</div> : null}
      {suggestionError ? <div className="error-banner">{suggestionError}</div> : null}

      <div className="builder-layout">
        <nav className="section-nav" aria-label="Technical volume sections">
          <div className="section-nav-heading">
            <span>Completeness</span>
            <small>Draft coverage, not evaluator score</small>
          </div>
          {project.sections.map((section) => {
            const completeness = sectionCompleteness[section.key];

            return (
              <button
                className={section.key === activeSection.key ? "active" : ""}
                type="button"
                key={section.key}
                onClick={() => setActiveKey(section.key)}
              >
                <div className="section-nav-row">
                  <span>{section.title}</span>
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
            </section>

            <section className="ai-suggestions" aria-label={`${activeSection.title} evaluator suggestions`}>
              <div className="insight-heading">
                <Lightbulb size={17} />
                <span>Evaluator Suggestions</span>
              </div>
              {activeSuggestion ? (
                <>
                  <p>{activeSuggestion.summary}</p>
                  <ul>
                    {activeSuggestion.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
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
