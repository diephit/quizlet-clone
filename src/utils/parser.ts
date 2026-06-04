import { BoldSpan, QuizQuestion } from "../types";

const questionStartPattern = /(^|\n|\s)(\d+)\.\s+/g;
const choicePattern = /(?:^|\n|\s)([a-zA-Z])\.\s+/g;

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const cleanSegment = (text: string) =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const makeId = (questionNumber: number, index: number) =>
  `${questionNumber}-${index}-${Math.random().toString(36).slice(2, 8)}`;

const splitQuestionBlocks = (text: string) => {
  const normalized = normalizeText(text);
  const matches = [...normalized.matchAll(questionStartPattern)];

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;

    return {
      questionNumber: Number(match[2]),
      content: normalized.slice(start, end).trim()
    };
  });
};

const detectCorrectAnswer = (
  choices: Record<string, string>,
  boldSpans: BoldSpan[] = []
) => {
  for (const span of boldSpans) {
    if (span.choiceKey && choices[span.choiceKey.toLowerCase()]) {
      return span.choiceKey.toLowerCase();
    }
  }

  const normalizedBold = boldSpans
    .map((span) => cleanSegment(span.text).toLowerCase())
    .filter(Boolean);

  if (normalizedBold.length === 0) {
    return null;
  }

  for (const [key, value] of Object.entries(choices)) {
    const normalizedChoice = cleanSegment(value).toLowerCase();
    if (
      normalizedBold.some(
        (boldText) =>
          normalizedChoice === boldText ||
          normalizedChoice.includes(boldText) ||
          boldText.includes(normalizedChoice)
      )
    ) {
      return key;
    }
  }

  return null;
};

export function parseQuestions(text: string, boldSpans: BoldSpan[] = []): QuizQuestion[] {
  return splitQuestionBlocks(text)
    .map((block, index) => {
      const choiceMatches = [...block.content.matchAll(choicePattern)];
      if (choiceMatches.length === 0) {
        return null;
      }

      const firstChoiceIndex = choiceMatches[0].index ?? 0;
      const question = cleanSegment(block.content.slice(0, firstChoiceIndex));
      const choices: Record<string, string> = {};

      // Each answer begins at a label such as "a." and ends right before
      // the next label. This preserves wrapped Vietnamese text while removing
      // OCR/PDF line-break noise.
      choiceMatches.forEach((choiceMatch, choiceIndex) => {
        const key = choiceMatch[1].toLowerCase();
        const labelEnd = (choiceMatch.index ?? 0) + choiceMatch[0].length;
        const nextStart = choiceMatches[choiceIndex + 1]?.index ?? block.content.length;
        choices[key] = cleanSegment(block.content.slice(labelEnd, nextStart));
      });

      return {
        id: makeId(block.questionNumber, index),
        questionNumber: block.questionNumber,
        question,
        choices,
        correctAnswer: detectCorrectAnswer(choices, boldSpans)
      };
    })
    .filter((question): question is QuizQuestion => Boolean(question));
}

export const sampleText = `1. Ý thức có trước, vật chất có sau, ý thức quyết định vật chất, đây là quan điểm nào?
a. Duy vật.
b. Duy tâm chủ quan.
c. Duy tâm.
d. Nhị nguyên.

2. Theo chủ nghĩa duy vật biện chứng, vật chất là gì?
a. Một dạng năng lượng tinh thần.
b. Thực tại khách quan tồn tại độc lập với ý thức.
c. Cảm giác chủ quan của con người.
d. Ý niệm tuyệt đối.`;
