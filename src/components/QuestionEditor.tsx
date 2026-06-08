import { QuizQuestion } from "../types";
import { normalizeAnswerKeys } from "../utils/answerKeys";

type Props = {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
};

const choiceKeys = ["a", "b", "c", "d"];

export function QuestionEditor({ questions, onChange }: Props) {
  const updateQuestion = (
    id: string,
    updater: (question: QuizQuestion) => QuizQuestion
  ) => onChange(questions.map((question) => (question.id === id ? updater(question) : question)));

  const toggleCorrectAnswer = (question: QuizQuestion, key: string) => {
    const correctAnswers = normalizeAnswerKeys(question.correctAnswer);
    const nextAnswers = correctAnswers.includes(key)
      ? correctAnswers.filter((answerKey) => answerKey !== key)
      : [...correctAnswers, key].sort();

    return nextAnswers.length > 0 ? nextAnswers : null;
  };

  if (questions.length === 0) {
    return (
      <section className="empty-state">
        Parsed questions will appear here for quick correction before saving.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">Extracted Questions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="table-head w-20">Number</th>
              <th className="table-head min-w-64">Question</th>
              {choiceKeys.map((key) => (
                <th className="table-head min-w-40" key={key}>{key.toUpperCase()}</th>
              ))}
              <th className="table-head w-44">Correct Answers</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr className="border-t border-slate-100" key={question.id}>
                <td className="table-cell">
                  <input
                    className="input"
                    type="number"
                    value={question.questionNumber}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        questionNumber: Number(event.target.value)
                      }))
                    }
                  />
                </td>
                <td className="table-cell">
                  <textarea
                    className="input min-h-20"
                    value={question.question}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        question: event.target.value
                      }))
                    }
                  />
                </td>
                {choiceKeys.map((key) => (
                  <td className="table-cell" key={key}>
                    <textarea
                      className="input min-h-20"
                      value={question.choices[key] ?? ""}
                      onChange={(event) =>
                        updateQuestion(question.id, (current) => ({
                          ...current,
                          choices: { ...current.choices, [key]: event.target.value }
                        }))
                      }
                    />
                  </td>
                ))}
                <td className="table-cell">
                  <div className="grid gap-2">
                    {Object.keys(question.choices).map((key) => {
                      const correctAnswers = normalizeAnswerKeys(question.correctAnswer);
                      const choiceText = question.choices[key]?.trim();

                      return (
                        <label
                          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                          key={key}
                        >
                          <input
                            className="h-4 w-4 accent-teal-600"
                            type="checkbox"
                            checked={correctAnswers.includes(key)}
                            disabled={!choiceText}
                            onChange={() =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                correctAnswer: toggleCorrectAnswer(current, key)
                              }))
                            }
                          />
                          <span>{key.toUpperCase()}</span>
                        </label>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
