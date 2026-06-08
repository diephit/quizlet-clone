import { useEffect, useMemo, useState } from "react";
import { DocumentUploader } from "./components/DocumentUploader";
import { ExportButtons } from "./components/ExportButtons";
import { FlashcardMode } from "./components/FlashcardMode";
import { QuestionEditor } from "./components/QuestionEditor";
import { QuizMode } from "./components/QuizMode";
import { BoldSpan, QuizQuestion } from "./types";
import { extractTextFromImage } from "./utils/ocr";
import { parseQuestions } from "./utils/parser";
import { extractTextFromPdf } from "./utils/pdfExtractor";
import {
  DisplayPreferences,
  importDeck,
  loadDeck,
  loadDisplayPreferences,
  loadKeepStudyingIds,
  saveDeck,
  saveDisplayPreferences,
  saveKeepStudyingIds,
} from "./utils/storage";

type StudyStatus = "keep-studying" | "memorized";
type Mode = "editor" | "flashcards" | "memorize" | "quiz" | "nonMemorized";

function App() {
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [keepStudyingIds, setKeepStudyingIds] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("editor");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(() => loadDisplayPreferences());

  useEffect(() => {
    setQuestions(loadDeck());
    setKeepStudyingIds(loadKeepStudyingIds());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", displayPreferences.theme === "dark");
    document.documentElement.classList.toggle("theme-pink", displayPreferences.theme === "🌸🌸🌸🌸🌸");
    document.documentElement.classList.toggle("font-svn-comic", displayPreferences.tayFont);
    saveDisplayPreferences(displayPreferences);
  }, [displayPreferences]);

  const validQuestions = useMemo(
    () => questions.filter((question) => question.question.trim() && Object.keys(question.choices).length > 0),
    [questions]
  );

  const nonMemorizedQuestions = useMemo(
    () => validQuestions.filter((question) => keepStudyingIds.includes(question.id)),
    [keepStudyingIds, validQuestions]
  );

  useEffect(() => {
    const validIds = new Set(validQuestions.map((question) => question.id));

    setKeepStudyingIds((ids) => {
      const nextIds = ids.filter((id) => validIds.has(id));
      if (nextIds.length === ids.length) {
        return ids;
      }

      saveKeepStudyingIds(nextIds);
      return nextIds;
    });

  }, [validQuestions]);

  const updateStudyStatus = (question: QuizQuestion, studyStatus: StudyStatus) => {
    setKeepStudyingIds((ids) => {
      const nextIds =
        studyStatus === "keep-studying"
          ? ids.includes(question.id)
            ? ids
            : [...ids, question.id]
          : ids.filter((id) => id !== question.id);

      saveKeepStudyingIds(nextIds);
      return nextIds;
    });

    setStatus(
      studyStatus === "keep-studying"
        ? `Question ${question.questionNumber} added to Keep Studying.`
        : `Question ${question.questionNumber} marked as memorized.`
    );
  };

  const processDocument = async () => {
    setBusy(true);
    setStatus("Extracting content...");

    try {
      let extractedText = rawText;
      let boldSpans: BoldSpan[] = [];

      if (file) {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const pdfResult = await extractTextFromPdf(file);
          extractedText = pdfResult.text;
          boldSpans = pdfResult.boldSpans;
        } else if (file.type.startsWith("image/")) {
          extractedText = await extractTextFromImage(file);
        } else {
          extractedText = await file.text();
        }
      }

      setRawText(extractedText);
      const parsed = parseQuestions(extractedText, boldSpans);
      setQuestions(parsed);
      setMode("editor");
      setStatus(`Found ${parsed.length} question${parsed.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not process the document.");
    } finally {
      setBusy(false);
    }
  };

  const saveCurrentDeck = () => {
    saveDeck(questions);
    setStatus(`Saved ${questions.length} question${questions.length === 1 ? "" : "s"} locally.`);
  };

  const updateDisplayPreference = <Key extends keyof DisplayPreferences>(
    key: Key,
    value: DisplayPreferences[Key]
  ) => {
    setDisplayPreferences((preferences) => ({ ...preferences, [key]: value }));
  };

  const handleImport = async (deckFile: File) => {
    try {
      const imported = await importDeck(deckFile);
      setQuestions(imported);
      saveDeck(imported);
      setMode("editor");
      setStatus(`Imported ${imported.length} question${imported.length === 1 ? "" : "s"}.`);
    } catch {
      setStatus("Import failed. Please choose a valid JSON deck.");
    }
  };

  if (mode === "flashcards") {
    return (
      <FlashcardMode
        questions={validQuestions}
        title="Learn Flashcards"
        onExit={() => setMode("editor")}
      />
    );
  }

  if (mode === "memorize") {
    return (
      <FlashcardMode
        questions={validQuestions}
        keepStudyingIds={keepStudyingIds}
        onExit={() => setMode("editor")}
        onMark={updateStudyStatus}
      />
    );
  }

  if (mode === "quiz") {
    return (
      <QuizMode
        questions={validQuestions}
        onExit={() => setMode("editor")}
      />
    );
  }

  if (mode === "nonMemorized") {
    return (
      <FlashcardMode
        questions={nonMemorizedQuestions}
        keepStudyingIds={keepStudyingIds}
        title="Non Memorized"
        onExit={() => setMode("editor")}
        onMark={updateStudyStatus}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Suộc mln 9 âm 👣 Kinh bởi</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950"> 🌸🌸Phú Quang🌸🌸🌸🌸🌸🌸🌸🌸🌸 </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="preference-select">
              <span>Theme</span>
              <select
                value={displayPreferences.theme}
                onChange={(event) =>
                  updateDisplayPreference(
                    "theme",
                    event.target.value as DisplayPreferences["theme"]
                  )
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="🌸🌸🌸🌸🌸">🌸🌸🌸🌸🌸</option>
              </select>
            </label>
            <label className="preference-toggle">
              <input
                type="checkbox"
                checked={displayPreferences.tayFont}
                onChange={(event) => updateDisplayPreference("tayFont", event.target.checked)}
              />
              <span>tày font</span>
            </label>
            <button className="btn-primary" onClick={saveCurrentDeck}>Save Deck</button>
            <button className="btn-secondary" disabled={validQuestions.length === 0} onClick={() => setMode("flashcards")}>
              Learn Flashcards
            </button>
            <button className="btn-secondary" disabled={validQuestions.length === 0} onClick={() => setMode("memorize")}>
              Memorize Cards
            </button>
            <button
              className="btn-secondary"
              disabled={nonMemorizedQuestions.length === 0}
              onClick={() => setMode("nonMemorized")}
            >
              View Non Memorized
            </button>
            <button className="btn-secondary" disabled={validQuestions.length === 0} onClick={() => setMode("quiz")}>
              Start Quiz
            </button>
          </div>
        </header>

        <DocumentUploader
          rawText={rawText}
          busy={busy}
          status={status}
          onTextChange={setRawText}
          onFileChange={setFile}
          onProcess={processDocument}
        />

        <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">Local deck</p>
            <p className="text-sm text-slate-500">
              {questions.length} editable questions loaded - {nonMemorizedQuestions.length} non memorized
            </p>
          </div>
          <ExportButtons questions={questions} onImport={handleImport} />
        </div>

        <QuestionEditor questions={questions} onChange={setQuestions} />
      </div>
    </main>
  );
}

export default App;
