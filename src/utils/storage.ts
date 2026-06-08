import { QuizQuestion } from "../types";

const STORAGE_KEY = "quizlet-clone-local-deck";
const KEEP_STUDYING_KEY = "quizlet-clone-keep-studying";
const DISPLAY_PREFERENCES_KEY = "quizlet-clone-display-preferences";

export type DisplayPreferences = {
  darkMode: boolean;
  comicFont: boolean;
};

const defaultDisplayPreferences: DisplayPreferences = {
  darkMode: false,
  comicFont: false,
};

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

export function loadKeepStudyingIds(): string[] {
  try {
    const raw = localStorage.getItem(KEEP_STUDYING_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveKeepStudyingIds(ids: string[]) {
  localStorage.setItem(KEEP_STUDYING_KEY, JSON.stringify(ids));
}

export function loadDisplayPreferences(): DisplayPreferences {
  try {
    const raw = localStorage.getItem(DISPLAY_PREFERENCES_KEY);
    return raw ? { ...defaultDisplayPreferences, ...JSON.parse(raw) } : defaultDisplayPreferences;
  } catch {
    return defaultDisplayPreferences;
  }
}

export function saveDisplayPreferences(preferences: DisplayPreferences) {
  localStorage.setItem(DISPLAY_PREFERENCES_KEY, JSON.stringify(preferences));
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
