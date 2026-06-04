import { useMemo, useState } from "react";
import { QuizQuestion } from "../types";

type Props = {
  questions: QuizQuestion[];
  onReviewIncorrect: (questions: QuizQuestion[]) => void;
  onExit: () => void;
};

export function QuizMode({ questions, onReviewIncorrect, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [incorrectIds, setIncorrectIds] = useState<string[]>([]);
  const current = questions[index];

  const availableChoices = useMemo(
    () => Object.entries(current?.choices ?? {}).filter(([, value]) => value.trim()),
    [current]
  );

  if (!current) {
    return <section className="empty-state">No quiz questions available.</section>;
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === current.correctAnswer;

  const choose = (key: string) => {
    if (isAnswered) {
      return;
    }
    setSelected(key);
    if (key !== current.correctAnswer) {
      setIncorrectIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]));
    }
  };

  const next = () => {
    setSelected(null);
    setIndex((value) => Math.min(value + 1, questions.length - 1));
  };

  const incorrectQuestions = questions.filter((question) => incorrectIds.includes(question.id));

  return (
    <section className="study-panel">
      <div className="study-topbar">
        <span>Quiz {index + 1}/{questions.length}</span>
        <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-teal-700">Question {current.questionNumber}</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{current.question}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {availableChoices.map(([key, value]) => {
            const active = selected === key;
            const correct = current.correctAnswer === key;
            const stateClass =
              isAnswered && correct
                ? "border-emerald-500 bg-emerald-50"
                : isAnswered && active
                  ? "border-rose-500 bg-rose-50"
                  : "border-slate-200 bg-white hover:border-teal-400";

            return (
              <button className={`choice-button ${stateClass}`} key={key} onClick={() => choose(key)}>
                <span className="font-bold">{key.toUpperCase()}.</span>
                <span>{value}</span>
              </button>
            );
          })}
        </div>
        {isAnswered && (
          <div className={`mt-4 rounded-md px-3 py-2 text-sm ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {isCorrect
              ? "Correct."
              : `Incorrect. Correct answer: ${current.correctAnswer?.toUpperCase() ?? "not selected"}.`}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <button
          className="btn-secondary"
          disabled={incorrectQuestions.length === 0}
          onClick={() => onReviewIncorrect(incorrectQuestions)}
        >
          Review Incorrect
        </button>
        <button className="btn-primary" disabled={!isAnswered || index === questions.length - 1} onClick={next}>
          Next Question
        </button>
      </div>
    </section>
  );
}
