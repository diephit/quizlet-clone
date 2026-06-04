# Quizlet Clone

A small React + TypeScript + Vite app for turning pasted text, images, and PDFs into editable flashcard decks.

## Run

```bash
npm install
npm run dev
```

## Features

- Paste raw multiple-choice text or upload image/PDF/TXT files.
- OCR images and scanned PDFs with Tesseract.js.
- Extract selectable PDF text with pdfjs-dist.
- Detect numbered questions and lettered answer choices.
- Use bold PDF text metadata when available to infer the correct answer.
- Edit parsed questions before saving to localStorage.
- Study with flashcards, multiple-choice quiz mode, and incorrect-answer review.
- Import/export JSON decks and export CSV.
