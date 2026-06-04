import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { createWorker } from "tesseract.js";
import { BoldSpan } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const isBoldFont = (fontName = "") => /bold|black|heavy|semibold|demi/i.test(fontName);

type PositionedText = {
  value: string;
  x: number;
  y: number;
  fontName: string;
};

const lineTolerance = 4;

const buildPageText = (items: PositionedText[]) => {
  const lines: PositionedText[][] = [];

  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.find((currentLine) => Math.abs(currentLine[0].y - item.y) <= lineTolerance);

    if (line) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((item) => item.value)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
};

export async function extractTextFromPdf(file: File): Promise<{
  text: string;
  boldSpans: BoldSpan[];
}> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const boldSpans: BoldSpan[] = [];

  const loadedPages: Array<Awaited<ReturnType<typeof pdf.getPage>>> = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    loadedPages.push(page);
    const content = await page.getTextContent();
    const pageItems: PositionedText[] = [];

    for (const item of content.items) {
      if (!("str" in item)) {
        continue;
      }

      const value = item.str;
      const transform = item.transform;
      pageItems.push({
        value,
        x: transform[4],
        y: transform[5],
        fontName: String(item.fontName)
      });

      if (isBoldFont(String(item.fontName))) {
        const labelMatch = value.match(/^\s*([a-zA-Z])\.\s*(.+)?/);
        boldSpans.push({
          text: labelMatch?.[2] ?? value,
          choiceKey: labelMatch?.[1]?.toLowerCase()
        });
      }
    }

    pages.push(buildPageText(pageItems));
  }

  const text = pages.join("\n").trim();
  if (text.length > 20) {
    return {
      text,
      boldSpans
    };
  }

  const worker = await createWorker("vie+eng");
  const ocrPages: string[] = [];

  try {
    for (const page of loadedPages) {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        continue;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

      if (blob) {
        const result = await worker.recognize(blob);
        ocrPages.push(result.data.text);
      }
    }
  } finally {
    await worker.terminate();
  }

  return {
    text: ocrPages.join("\n"),
    boldSpans: []
  };
}
