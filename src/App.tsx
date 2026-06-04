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
import { importDeck, loadDeck, saveDeck } from "./utils/storage";

type Mode = "editor" | "flashcards" | "quiz" | "review";

function App() {
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<QuizQuestion[]>([]);
  const [mode, setMode] = useState<Mode>("editor");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setQuestions(loadDeck());
  }, []);

  const validQuestions = useMemo(
    () => questions.filter((question) => question.question.trim() && Object.keys(question.choices).length > 0),
    [questions]
  );

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
    return <FlashcardMode questions={validQuestions} onExit={() => setMode("editor")} />;
  }

  if (mode === "quiz") {
    return (
      <QuizMode
        questions={validQuestions}
        onExit={() => setMode("editor")}
        onReviewIncorrect={(items) => {
          setReviewQuestions(items);
          setMode("review");
        }}
      />
    );
  }

  if (mode === "review") {
    return (
      <FlashcardMode
        questions={reviewQuestions}
        reviewOnly
        onExit={() => setMode("editor")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Skibidi toilet</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">them bu cu be gai</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={saveCurrentDeck}>Save Deck</button>
            <button className="btn-secondary" disabled={validQuestions.length === 0} onClick={() => setMode("flashcards")}>
              Start Flashcards
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
            <p className="text-sm text-slate-500">{questions.length} editable questions loaded</p>
          </div>
          <ExportButtons questions={questions} onImport={handleImport} />
        </div>

        <QuestionEditor questions={questions} onChange={setQuestions} />
      </div>
    </main>
  );
}

export default App;
