import { useMemo, useState } from "react";
import { Download, FileDown, WandSparkles } from "lucide-react";
import { Project, VolumeSection, VolumeSectionKey } from "../types";
import { exportDocx, exportMarkdown } from "../utils/exporters";

type VolumeBuilderProps = {
  project: Project;
  onUpdateProject: (project: Project) => void;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const suggestedSectionContent = (project: Project): Record<VolumeSectionKey, string> => ({
  problemNeed:
    "Define the mission or market need in reviewer-facing terms. Quantify the pain, operational gap, current limitation, and why the problem matters now.",
  technicalApproach:
    "Describe the technical hypothesis, architecture, methods, experiments, and success criteria. Tie each technical claim to a measurable validation activity.",
  innovation:
    "Explain what is novel compared with existing products, research, or internal alternatives. Make the defensibility clear without overstating maturity.",
  workPlan:
    "Organize Phase I work into tasks with objectives, deliverables, responsible contributors, timing, and go/no-go criteria.",
  team:
    "Map each key person or partner to the technical, commercialization, and transition work they own. Address gaps with advisors, subcontractors, or hiring plans.",
  commercializationTransition:
    project.evaluation
      ? project.evaluation.transitionPotential.join("\n\n")
      : "Define target customers, first use cases, market entry, DoD transition owner, procurement path, and post-award adoption milestones.",
  risks:
    "List technical, schedule, budget, regulatory, security, and adoption risks. Pair each risk with likelihood, impact, mitigation, and fallback evidence.",
  budgetNarrative:
    "Explain labor, materials, travel, subcontractors, indirect costs, and how each cost supports the work plan and expected deliverables.",
});

export const VolumeBuilder = ({ project, onUpdateProject }: VolumeBuilderProps) => {
  const [activeKey, setActiveKey] = useState<VolumeSectionKey>(project.sections[0].key);
  const activeSection = project.sections.find((section) => section.key === activeKey) ?? project.sections[0];

  const totalWords = useMemo(
    () => project.sections.reduce((sum, section) => sum + countWords(section.content), 0),
    [project.sections],
  );

  const updateSection = (section: VolumeSection, content: string) => {
    onUpdateProject({
      ...project,
      sections: project.sections.map((existing) => (existing.key === section.key ? { ...existing, content } : existing)),
    });
  };

  const fillEmptySections = () => {
    const suggestions = suggestedSectionContent(project);
    onUpdateProject({
      ...project,
      sections: project.sections.map((section) => ({
        ...section,
        content: section.content.trim() ? section.content : suggestions[section.key],
      })),
    });
  };

  return (
    <div className="builder">
      <header className="builder-toolbar">
        <div>
          <p className="eyebrow">Technical volume builder</p>
          <h2>{totalWords} words across 8 sections</h2>
        </div>
        <div className="toolbar-actions">
          <button className="button" type="button" onClick={fillEmptySections}>
            <WandSparkles size={17} />
            Draft Empty Sections
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
            <span>{countWords(activeSection.content)} words</span>
          </header>
          <textarea
            value={activeSection.content}
            onChange={(event) => updateSection(activeSection, event.target.value)}
            placeholder={`Draft the ${activeSection.title.toLowerCase()} section.`}
          />
        </section>
      </div>
    </div>
  );
};
