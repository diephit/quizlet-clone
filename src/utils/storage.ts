import { QuizQuestion } from "../types";
import { normalizeAnswerKeys } from "./answerKeys";

const STORAGE_KEY = "quizlet-clone-local-deck";
const KEEP_STUDYING_KEY = "quizlet-clone-keep-studying";
const DISPLAY_PREFERENCES_KEY = "quizlet-clone-display-preferences";

export type ThemePreference = "light" | "dark" | "🌸🌸🌸🌸🌸";

export type DisplayPreferences = {
  theme: ThemePreference;
  tayFont: boolean;
};

const flowerTheme: ThemePreference = "🌸🌸🌸🌸🌸";

const defaultDisplayPreferences: DisplayPreferences = {
  theme: "light",
  tayFont: false,
};

const normalizeDeck = (questions: QuizQuestion[]) =>
  questions.map((question) => ({
    ...question,
    correctAnswer: normalizeAnswerKeys(question.correctAnswer),
  }));

export function loadDeck(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeDeck(JSON.parse(raw) as QuizQuestion[]) : [];
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
    if (!raw) {
      return defaultDisplayPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<DisplayPreferences> & {
      comicFont?: boolean;
      darkMode?: boolean;
      theme?: string;
    };
    const rawTheme = String(parsed.theme ?? "");
    const theme =
      rawTheme === "light" || rawTheme === "dark" || rawTheme === flowerTheme
        ? rawTheme
        : rawTheme === "pink" || rawTheme === "flowers"
          ? flowerTheme
          : parsed.darkMode
            ? "dark"
            : defaultDisplayPreferences.theme;

    return {
      theme,
      tayFont: parsed.tayFont ?? parsed.comicFont ?? defaultDisplayPreferences.tayFont,
    };
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
        resolve(normalizeDeck(JSON.parse(String(reader.result)) as QuizQuestion[]));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}
