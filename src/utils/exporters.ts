import { Project } from "../types";

const fileSafe = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "proposal-draft";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const buildMarkdown = (project: Project) => {
  const metadata = [
    `# ${project.name}`,
    "",
    `- Agency: ${project.agency}`,
    `- Program: ${project.program}`,
    `- Topic ID: ${project.topicId || "Not specified"}`,
    `- Phase: ${project.phase}`,
    project.dueDate ? `- Due date: ${project.dueDate}` : "",
  ].filter(Boolean);

  const sections = project.sections.flatMap((section) => [
    "",
    `## ${section.title}`,
    "",
    section.content.trim() || "_Draft content pending._",
  ]);

  return [...metadata, ...sections, ""].join("\n");
};

export const exportMarkdown = (project: Project) => {
  const blob = new Blob([buildMarkdown(project)], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${fileSafe(project.name)}.md`);
};

export const exportDocx = async (project: Project) => {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");

  const children = [
    new Paragraph({
      text: project.name,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Agency: ${project.agency}`, break: 1 }),
        new TextRun({ text: `Program: ${project.program}`, break: 1 }),
        new TextRun({ text: `Topic ID: ${project.topicId || "Not specified"}`, break: 1 }),
        new TextRun({ text: `Phase: ${project.phase}`, break: 1 }),
        new TextRun({ text: project.dueDate ? `Due date: ${project.dueDate}` : "Due date: Not specified", break: 1 }),
      ],
    }),
    ...project.sections.flatMap((section) => [
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
      }),
      ...section.content
        .split(/\n{2,}/)
        .map(
          (paragraph) =>
            new Paragraph({
              text: paragraph.trim() || "Draft content pending.",
            }),
        ),
    ]),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileSafe(project.name)}.docx`);
};
