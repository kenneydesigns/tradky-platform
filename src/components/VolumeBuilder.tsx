import { useMemo, useState } from "react";
import { Download, FileDown, WandSparkles } from "lucide-react";
import { Project, VolumeSection, VolumeSectionKey } from "../types";
import { draftVolumeSections } from "../services/aiClient";
import { exportDocx, exportMarkdown } from "../utils/exporters";

type VolumeBuilderProps = {
  project: Project;
  onUpdateProject: (project: Project) => void;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const VolumeBuilder = ({ project, onUpdateProject }: VolumeBuilderProps) => {
  const [activeKey, setActiveKey] = useState<VolumeSectionKey>(project.sections[0].key);
  const [draftingTarget, setDraftingTarget] = useState<"empty" | VolumeSectionKey | null>(null);
  const [draftError, setDraftError] = useState("");
  const activeSection = project.sections.find((section) => section.key === activeKey) ?? project.sections[0];

  const totalWords = useMemo(
    () => project.sections.reduce((sum, section) => sum + countWords(section.content), 0),
    [project.sections],
  );
  const emptySectionKeys = useMemo(
    () => project.sections.filter((section) => !section.content.trim()).map((section) => section.key),
    [project.sections],
  );

  const updateSection = (section: VolumeSection, content: string) => {
    onUpdateProject({
      ...project,
      sections: project.sections.map((existing) => (existing.key === section.key ? { ...existing, content } : existing)),
    });
  };

  const applySectionDrafts = (draftedSections: VolumeSection[]) => {
    const draftByKey = new Map(draftedSections.map((section) => [section.key, section.content]));

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

  const draftEmptySections = () => {
    void draftSections(emptySectionKeys, "empty");
  };

  const draftActiveSection = () => {
    void draftSections([activeSection.key], activeSection.key);
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

      <div className="builder-layout">
        <nav className="section-nav" aria-label="Technical volume sections">
          {project.sections.map((section) => (
            <button
              className={section.key === activeSection.key ? "active" : ""}
              type="button"
              key={section.key}
              onClick={() => setActiveKey(section.key)}
            >
              <span>{section.title}</span>
              <small>{countWords(section.content)} words</small>
            </button>
          ))}
        </nav>

        <section className="section-editor">
          <header>
            <div>
              <p className="eyebrow">Editable section</p>
              <h2>{activeSection.title}</h2>
            </div>
            <div className="section-editor-actions">
              <span>{countWords(activeSection.content)} words</span>
              <button className="button compact" type="button" disabled={draftingTarget !== null} onClick={draftActiveSection}>
                <WandSparkles size={16} />
                {draftingTarget === activeSection.key ? "Drafting..." : "AI Draft This Section"}
              </button>
            </div>
          </header>
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
