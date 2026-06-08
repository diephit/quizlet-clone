import { QuizQuestion } from "../types";

export const normalizeAnswerKeys = (answer: QuizQuestion["correctAnswer"]): string[] => {
  if (!answer) {
    return [];
  }

  const answers = Array.isArray(answer) ? answer : [answer];
  return [...new Set(answers.map((key) => key.trim().toLowerCase()).filter(Boolean))].sort();
};

export const answerSetsMatch = (selectedKeys: string[], correctKeys: string[]) => {
  const selected = normalizeAnswerKeys(selectedKeys);
  const correct = normalizeAnswerKeys(correctKeys);

  return selected.length === correct.length && selected.every((key, index) => key === correct[index]);
};

export const formatAnswerLabel = (question: QuizQuestion) => {
  const correctKeys = normalizeAnswerKeys(question.correctAnswer);

  if (correctKeys.length === 0) {
    return "not selected";
  }

  return correctKeys.map((key) => key.toUpperCase()).join(", ");
};

export const formatAnswerText = (question: QuizQuestion) => {
  const correctKeys = normalizeAnswerKeys(question.correctAnswer);

  if (correctKeys.length === 0) {
    return "No correct answer selected yet.";
  }

  return correctKeys
    .map((key) => `${key.toUpperCase()}. ${question.choices[key] ?? ""}`.trim())
    .join("\n");
};
