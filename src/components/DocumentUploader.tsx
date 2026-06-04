import { ChangeEvent, useState } from "react";
import { sampleText } from "../utils/parser";

type Props = {
  rawText: string;
  busy: boolean;
  status: string;
  onTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
  onProcess: () => void;
};

export function DocumentUploader({
  rawText,
  busy,
  status,
  onTextChange,
  onFileChange,
  onProcess
}: Props) {
  const [fileName, setFileName] = useState("");

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileName(file?.name ?? "");
    onFileChange(file);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-teal-500 hover:bg-teal-50">
          <input
            className="sr-only"
            type="file"
            accept="image/*,.pdf,application/pdf,.txt"
            onChange={handleFile}
          />
          <span className="text-sm font-semibold text-slate-800">Upload image, PDF, or text</span>
          <span className="mt-2 text-xs text-slate-500">
            {fileName || "OCR images and scanned pages, extract text from PDFs"}
          </span>
        </label>

        <div className="space-y-3">
          <textarea
            className="h-44 w-full resize-y rounded-md border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            value={rawText}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Paste numbered multiple-choice questions here..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" disabled={busy} onClick={onProcess}>
              {busy ? "Processing..." : "Process Document"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => onTextChange(sampleText)}>
              Load Sample Text
            </button>
            <span className="text-sm text-slate-500">{status}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
