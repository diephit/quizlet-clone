import { QuizQuestion } from "../types";

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
              <th className="table-head w-36">Correct Answer</th>
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
                  <select
                    className="input"
                    value={question.correctAnswer ?? ""}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        correctAnswer: event.target.value || null
                      }))
                    }
                  >
                    <option value="">Choose</option>
                    {Object.keys(question.choices).map((key) => (
                      <option value={key} key={key}>{key.toUpperCase()}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
