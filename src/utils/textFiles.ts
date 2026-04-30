import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TEXT_EXTENSIONS = new Set(["txt", "md", "rtf", "csv"]);

export const ACCEPTED_SOURCE_FILE_TYPES = ".txt,.md,.rtf,.csv,.docx,.pdf";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

const loadPdfjs = async () => {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjsLib) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return pdfjsLib;
  });

  return pdfjsPromise;
};

const getExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() ?? "";

const normalizeExtractedText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const collectDocxNodeText = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (!(node instanceof Element)) {
    return "";
  }

  if (node.localName === "t") {
    return node.textContent ?? "";
  }

  if (node.localName === "tab") {
    return "\t";
  }

  if (node.localName === "br" || node.localName === "cr") {
    return "\n";
  }

  return Array.from(node.childNodes).map(collectDocxNodeText).join("");
};

const extractDocxPartText = (xml: string) => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("The Word document could not be parsed.");
  }

  return Array.from(doc.getElementsByTagNameNS("*", "p"))
    .map((paragraph) => normalizeExtractedText(collectDocxNodeText(paragraph)))
    .filter(Boolean)
    .join("\n\n");
};

const readDocxFile = async (file: File) => {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const partNames = Object.keys(zip.files)
    .filter((name) => /^word\/(?:document|header\d+|footer\d+)\.xml$/.test(name))
    .sort((a, b) => {
      if (a === "word/document.xml") return -1;
      if (b === "word/document.xml") return 1;
      return a.localeCompare(b);
    });

  const parts = await Promise.all(
    partNames.map(async (name) => {
      const part = zip.file(name);
      return part ? extractDocxPartText(await part.async("text")) : "";
    }),
  );

  const text = normalizeExtractedText(parts.filter(Boolean).join("\n\n"));
  if (!text) {
    throw new Error("No readable text was found in that Word document.");
  }

  return text;
};

const readPdfFile = async (file: File) => {
  const pdfjsLib = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lineMap = new Map<number, Array<{ text: string; x: number }>>();

      for (const item of textContent.items) {
        if (!("str" in item) || !item.str.trim() || !("transform" in item) || !Array.isArray(item.transform)) {
          continue;
        }

        const y = Math.round(item.transform[5]);
        const lineItems = lineMap.get(y) ?? [];
        lineItems.push({ text: item.str, x: item.transform[4] });
        lineMap.set(y, lineItems);
      }

      const pageText = Array.from(lineMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([, lineItems]) =>
          lineItems
            .sort((a, b) => a.x - b.x)
            .map((item) => item.text)
            .join(" "),
        )
        .join("\n");

      pages.push(pageText);
    }
  } finally {
    void pdfDocument.destroy();
  }

  const text = normalizeExtractedText(pages.filter(Boolean).join("\n\n"));
  if (!text) {
    throw new Error("No readable text was found in that PDF.");
  }

  return text;
};

export const readTextFile = async (file: File): Promise<string> => {
  const extension = getExtension(file);

  if (extension === "docx" || file.type === DOCX_MIME) {
    return readDocxFile(file);
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    return readPdfFile(file);
  }

  if (TEXT_EXTENSIONS.has(extension) || file.type.startsWith("text/")) {
    const text = normalizeExtractedText(await file.text());
    if (!text) {
      throw new Error("No readable text was found in that file.");
    }

    return text;
  }

  throw new Error("Upload a TXT, Markdown, RTF, CSV, DOCX, or PDF file.");
};
