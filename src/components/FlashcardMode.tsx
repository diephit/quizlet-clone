import { useMemo, useState } from "react";
import { QuizQuestion } from "../types";

type Props = {
  questions: QuizQuestion[];
  reviewOnly?: boolean;
  onExit: () => void;
};

export function FlashcardMode({ questions, reviewOnly = false, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = questions[index];

  const answerText = useMemo(() => {
    if (!current?.correctAnswer) {
      return "No correct answer selected yet.";
    }
    return `${current.correctAnswer.toUpperCase()}. ${current.choices[current.correctAnswer] ?? ""}`;
  }, [current]);

  if (!current) {
    return <section className="empty-state">No cards available.</section>;
  }

  const move = (nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), questions.length - 1));
    setRevealed(false);
  };

  return (
    <section className="study-panel">
      <div className="study-topbar">
        <span>{reviewOnly ? "Review Flashcards" : "Flashcards"} {index + 1}/{questions.length}</span>
        <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
      </div>
      <button className="flashcard" onClick={() => setRevealed((value) => !value)}>
        <span className="text-sm font-semibold text-teal-700">
          {revealed ? "Answer" : `Question ${current.questionNumber}`}
        </span>
        <span className="mt-4 block text-xl font-semibold text-slate-950">
          {revealed ? answerText : current.question}
        </span>
      </button>
      <div className="flex justify-between gap-3">
        <button className="btn-secondary" disabled={index === 0} onClick={() => move(index - 1)}>
          Previous
        </button>
        <button className="btn-primary" disabled={index === questions.length - 1} onClick={() => move(index + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}
