export type QuizQuestion = {
  id: string;
  questionNumber: number;
  question: string;
  choices: {
    [key: string]: string;
  };
  correctAnswer: string | null;
};

export type BoldSpan = {
  text: string;
  choiceKey?: string;
};
