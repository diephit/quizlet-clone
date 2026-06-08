import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { QuizQuestion } from "../types";

type Props = {
  questions: QuizQuestion[];
  keepStudyingIds?: string[];
  reviewOnly?: boolean;
  title?: string;
  onMark?: (question: QuizQuestion, status: "keep-studying" | "memorized") => void;
  onExit: () => void;
};

const SWIPE_THRESHOLD = 90;
const FEEDBACK_DELAY_MS = 150;
type StudyMark = "keep-studying" | "memorized";

const markFeedback: Record<StudyMark, { label: string; rgb: string; border: string; text: string }> = {
  "keep-studying": {
    label: "not tày",
    rgb: "254, 215, 170",
    border: "rgb(253, 186, 116)",
    text: "rgb(255, 144, 100)",
  },
  memorized: {
    label: "tày",
    rgb: "187, 247, 208",
    border: "rgb(134, 239, 172)",
    text: "rgb(21, 128, 61)",
  },
};

export function FlashcardMode({
  questions,
  keepStudyingIds = [],
  reviewOnly = false,
  title,
  onMark,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [pendingMark, setPendingMark] = useState<StudyMark | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const current = questions[index];

  const move = (nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), questions.length - 1));
    setRevealed(false);
  };

  const advanceAfterMark = () => {
    setRevealed(false);
    setIndex((value) => Math.min(value + 1, questions.length - 1));
  };

  const markCurrent = (status: StudyMark, showFeedback = true) => {
    if (!current || !onMark || pendingMark) {
      return;
    }

    const questionToMark = current;

    if (!showFeedback) {
      onMark(questionToMark, status);
      advanceAfterMark();
      return;
    }

    setPendingMark(status);
    setDragX(0);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      onMark(questionToMark, status);
      setPendingMark(null);
      advanceAfterMark();
      feedbackTimerRef.current = null;
    }, FEEDBACK_DELAY_MS);
  };

  const choiceEntries = useMemo(
    () => Object.entries(current?.choices ?? {}).filter(([, value]) => value.trim()),
    [current]
  );

  const keepStudyingSet = useMemo(() => new Set(keepStudyingIds), [keepStudyingIds]);
  const currentStatusLabel = current && keepStudyingSet.has(current.id) ? "Not learned" : "Unmarked";
  const dragMark: StudyMark | null = dragX < 0 ? "keep-studying" : dragX > 0 ? "memorized" : null;
  const activeMark = pendingMark ?? dragMark;
  const dragProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const feedbackProgress = pendingMark ? 1 : dragProgress;
  const activeFeedback = activeMark ? markFeedback[activeMark] : null;
  const contentOpacity = activeFeedback ? Math.max(1 - feedbackProgress, 0) : 1;

  const answerText = useMemo(() => {
    if (!current?.correctAnswer) {
      return "No correct answer selected yet.";
    }
    return `${current.correctAnswer.toUpperCase()}. ${current.choices[current.correctAnswer] ?? ""}`;
  }, [current]);

  useEffect(() => {
    setIndex((value) => Math.min(value, Math.max(questions.length - 1, 0)));
    setRevealed(false);
  }, [questions.length]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }

      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "ArrowDown") {
        setRevealed((value) => !value);
        return;
      }

      if (event.code === "ArrowLeft") {
        if (onMark) {
          markCurrent("keep-studying");
        } else {
          move(index - 1);
        }
      }

      if (event.code === "ArrowRight") {
        if (onMark) {
          markCurrent("memorized");
        } else {
          move(index + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, index, onMark, pendingMark, questions.length]);

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (pendingMark) {
      return;
    }

    dragStartRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartRef.current === null) {
      return;
    }

    const nextDragX = event.clientX - dragStartRef.current;
    setDragX(Math.max(Math.min(nextDragX, 140), -140));
  };

  const finishDrag = () => {
    const finalDragX = dragX;
    dragStartRef.current = null;
    setDragX(0);

    if (!onMark || Math.abs(finalDragX) < SWIPE_THRESHOLD) {
      return;
    }

    suppressClickRef.current = true;
    markCurrent(finalDragX < 0 ? "keep-studying" : "memorized");
  };

  const toggleReveal = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setRevealed((value) => !value);
  };

  if (!current) {
    return (
      <section className="study-panel">
        <div className="study-topbar">
          <span>{title ?? (reviewOnly ? "Review Flashcards" : "Flashcards")}</span>
          <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
        </div>
        <div className="empty-state">No cards available.</div>
      </section>
    );
  }

  return (
    <section className="study-panel">
      <div className="study-topbar">
        <span>{title ?? (reviewOnly ? "Review Flashcards" : "Flashcards")} {index + 1}/{questions.length}</span>
        <button className="btn-secondary" onClick={onExit}>Back to Editor</button>
      </div>
      {onMark && (
        <div className="grid gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:grid-cols-3 sm:items-center">
          <span className="font-semibold text-slate-900">{currentStatusLabel}</span>
          <span className="text-left sm:text-center">Swipe or press Left to keep studying</span>
          <span className="text-left sm:text-right">Swipe or press Right when memorized</span>
        </div>
      )}
      <button
        className="flashcard relative overflow-hidden"
        onClick={toggleReveal}
        onPointerCancel={finishDrag}
        onPointerDown={startDrag}
        onPointerMove={updateDrag}
        onPointerUp={finishDrag}
        style={{
          transform: dragX ? `translateX(${dragX}px) rotate(${dragX / 28}deg)` : undefined,
          backgroundColor: activeFeedback ? `rgba(${activeFeedback.rgb}, ${feedbackProgress * 0.72})` : undefined,
          borderColor: activeFeedback ? activeFeedback.border : undefined,
        }}
      >
        {onMark && activeFeedback && (
          <span
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-4xl font-black uppercase tracking-wide sm:text-5xl"
            style={{
              color: activeFeedback.text,
              fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
              opacity: feedbackProgress,
            }}
          >
            {activeFeedback.label}
          </span>
        )}
        <span
          className="relative z-0 block transition-opacity duration-150"
          style={{ opacity: contentOpacity }}
        >
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-teal-700">
              {revealed ? "Answer" : `Question ${current.questionNumber}`}
            </span>
            {onMark && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tap to flip
              </span>
            )}
          </span>
          {revealed ? (
            <span className="mt-4 block rounded-md border border-teal-200 bg-teal-50 p-5 text-xl font-semibold text-slate-950">
              {answerText}
            </span>
          ) : (
            <span className="mt-4 block space-y-5">
              <span className="block text-xl font-semibold text-slate-950">
                {current.question}
              </span>
              <span className="grid gap-3">
                {choiceEntries.map(([key, value]) => (
                  <span
                    className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800"
                    key={key}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold uppercase text-teal-700 ring-1 ring-slate-200">
                      {key}
                    </span>
                    <span>{value}</span>
                  </span>
                ))}
              </span>
            </span>
          )}
        </span>
      </button>
      <div className="flex flex-wrap justify-between gap-3">
        <button className="btn-secondary" disabled={index === 0} onClick={() => move(index - 1)}>
          Previous
        </button>
        {onMark ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" disabled={Boolean(pendingMark)} onClick={() => markCurrent("keep-studying")}>
              Keep Studying
            </button>
            <button className="btn-primary" disabled={Boolean(pendingMark)} onClick={() => markCurrent("memorized")}>
              Memorized
            </button>
          </div>
        ) : (
          <button className="btn-primary" disabled={index === questions.length - 1} onClick={() => move(index + 1)}>
            Next
          </button>
        )}
      </div>
    </section>
  );
}
