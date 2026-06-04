import { createWorker } from "tesseract.js";

export async function extractTextFromImage(file: File) {
  const worker = await createWorker("vie+eng");

  try {
    const result = await worker.recognize(file);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}
