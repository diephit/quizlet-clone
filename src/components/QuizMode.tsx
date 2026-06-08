import { useMemo, useState } from "react";
import { QuizQuestion } from "../types";
import { answerSetsMatch, formatAnswerLabel, normalizeAnswerKeys } from "../utils/answerKeys";

type Props = {
  questions: QuizQuestion[];
  onExit: () => void;
};

type QuizRunMode = "all" | "retry";

export function QuizMode({ questions, onExit }: Props) {
  const [quizRunMode, setQuizRunMode] = useState<QuizRunMode>("all");
  const [index, setIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, string[]>>({});
  const [submittedById, setSubmittedById] = useState<Record<string, boolean>>({});
  const [incorrectIds, setIncorrectIds] = useState<string[]>([]);
  const [retryIds, setRetryIds] = useState<string[]>([]);
  const activeQuestions = useMemo(
    () => (quizRunMode === "retry" ? questions.filter((question) => retryIds.includes(question.id)) : questions),
    [questions, quizRunMode, retryIds]
  );
  const incorrectQuestions = useMemo(
    () => questions.filter((question) => incorrectIds.includes(question.id)),
    [incorrectIds, questions]
  );
  const current = activeQuestions[index];
  const selected = current ? selectedById[current.id] ?? [] : [];
  const correctAnswers = current ? normalizeAnswerKeys(current.correctAnswer) : [];
  const isSubmitted = current ? Boolean(submittedById[current.id]) : false;

  const availableChoices = useMemo(
    () => Object.entries(current?.choices ?? {}).filter(([, value]) => value.trim()),
    [current]
  );

  if (!current) {
    return (
      <section className="study-panel">
        <div className="study-topbar">
          <span>{quizRunMode === "retry" ? "Retry Wrong Questions" : "Quiz"}</span>
          <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
        </div>
        <div className="empty-state">
          {quizRunMode === "retry" ? "No wrong questions left to retry." : "No quiz questions available."}
        </div>
      </section>
    );
  }

  const isCorrect = isSubmitted && answerSetsMatch(selected, correctAnswers);

  const choose = (key: string) => {
    if (isSubmitted) {
      return;
    }

    setSelectedById((answers) => {
      const currentAnswers = normalizeAnswerKeys(answers[current.id] ?? []);
      const nextAnswers = currentAnswers.includes(key)
        ? currentAnswers.filter((answerKey) => answerKey !== key)
        : [...currentAnswers, key].sort();

      return { ...answers, [current.id]: nextAnswers };
    });
  };

  const submitAnswer = () => {
    if (isSubmitted || selected.length === 0) {
      return;
    }

    setSubmittedById((answers) => ({ ...answers, [current.id]: true }));

    if (!answerSetsMatch(selected, correctAnswers)) {
      setIncorrectIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]));
      return;
    }

    if (quizRunMode === "retry") {
      setIncorrectIds((ids) => ids.filter((id) => id !== current.id));
    }
  };

  const move = (nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), activeQuestions.length - 1));
  };

  const startRetryWrong = () => {
    const nextRetryIds = incorrectQuestions.map((question) => question.id);
    if (nextRetryIds.length === 0) {
      return;
    }

    setQuizRunMode("retry");
    setRetryIds(nextRetryIds);
    setSelectedById({});
    setSubmittedById({});
    setIndex(0);
  };

  const returnToFullQuiz = () => {
    setQuizRunMode("all");
    setSelectedById({});
    setSubmittedById({});
    setIndex(0);
  };

  return (
    <section className="study-panel">
      <div className="study-topbar">
        <span>
          {quizRunMode === "retry" ? "Retry Wrong" : "Quiz"} {index + 1}/{activeQuestions.length}
        </span>
        <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-teal-700">Question {current.questionNumber}</p>
          <p className="text-sm font-semibold text-slate-500">
            {incorrectQuestions.length} wrong saved
          </p>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{current.question}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {availableChoices.map(([key, value]) => {
            const active = selected.includes(key);
            const correct = correctAnswers.includes(key);
            const stateClass =
              isSubmitted && correct
                ? "border-emerald-500 bg-emerald-50"
                : isSubmitted && active
                  ? "border-rose-500 bg-rose-50"
                  : active
                    ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-teal-400";

            return (
              <button className={`choice-button ${stateClass}`} key={key} onClick={() => choose(key)}>
                <span className="font-bold">{key.toUpperCase()}.</span>
                <span>{value}</span>
              </button>
            );
          })}
        </div>
        {isSubmitted && (
          <div className={`mt-4 rounded-md px-3 py-2 text-sm ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {isCorrect
              ? quizRunMode === "retry"
                ? "Correct. Removed from wrong questions."
                : "Correct."
              : `Incorrect. Correct answer: ${formatAnswerLabel(current)}.`}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <button className="btn-secondary" disabled={index === 0} onClick={() => move(index - 1)}>
          Previous
        </button>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={selected.length === 0 || isSubmitted} onClick={submitAnswer}>
            Submit Answer
          </button>
          {quizRunMode === "retry" && (
            <button className="btn-secondary" onClick={returnToFullQuiz}>
              Full Quiz
            </button>
          )}
          <button className="btn-secondary" disabled={incorrectQuestions.length === 0} onClick={startRetryWrong}>
            Retry Wrong
          </button>
        </div>
        <button className="btn-primary" disabled={!isSubmitted || index === activeQuestions.length - 1} onClick={() => move(index + 1)}>
          Next Question
        </button>
      </div>
    </section>
  );
}
