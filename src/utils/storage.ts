import { QuizQuestion } from "../types";

const STORAGE_KEY = "quizlet-clone-local-deck";

export function loadDeck(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizQuestion[]) : [];
  } catch {
    return [];
  }
}

export function saveDeck(questions: QuizQuestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function importDeck(file: File): Promise<QuizQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as QuizQuestion[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}
