import { ChangeEvent } from "react";
import { QuizQuestion } from "../types";

type Props = {
  questions: QuizQuestion[];
  onImport: (file: File) => void;
};

const download = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const toCsv = (questions: QuizQuestion[]) => {
  const headers = ["Number", "Question", "A", "B", "C", "D", "Correct Answer"];
  const rows = questions.map((question) => [
    question.questionNumber,
    question.question,
    question.choices.a ?? "",
    question.choices.b ?? "",
    question.choices.c ?? "",
    question.choices.d ?? "",
    question.correctAnswer ?? ""
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
};

export function ExportButtons({ questions, onImport }: Props) {
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    event.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="btn-secondary"
        onClick={() => download("quiz-deck.json", JSON.stringify(questions, null, 2), "application/json")}
      >
        Export JSON
      </button>
      <button
        className="btn-secondary"
        onClick={() => download("quiz-deck.csv", toCsv(questions), "text/csv;charset=utf-8")}
      >
        Export CSV
      </button>
      <label className="btn-secondary cursor-pointer">
        Import JSON
        <input className="sr-only" type="file" accept="application/json,.json" onChange={handleImport} />
      </label>
    </div>
  );
}
