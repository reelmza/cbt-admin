import { Dispatch, SetStateAction } from "react";

export type SectionType = {
  title: string;
  type: string;
  instruction: string;
  defaultQuestionScore: number;
  // Minutes allowed for this section on its own; 0 means it is not timed
  timeLimit: number;
  // A single shared stimulus shown above every question in the section
  image: string;
  questions: {
    question: string;
    type: string;
    score: number;
    options: { label: string; text: string }[];
    answerSlots: { slotNumber: number; possibleAnswers: string[] }[];
    expectedAnswer: string;
    correctAnswer: string;
    correctAnswers: string[];
    image: string;
  }[];
}[];

export type AssessmentType = {
  title: string;
  course: string;
  session: string;
  term: string;
  instruction: string;
  status: string;
  totalMarks: number;
  startDate: string;
  dueDate: string;
  sections: SectionType;
};

export type QuestionFormType = {
  formType: string;
  sectionParams: {
    sections: SectionType | null;
    setSections: Dispatch<SetStateAction<SectionType | null>>;
  };
  questionParams: {
    question: string;
    setQuestion: Dispatch<SetStateAction<string>>;
  };

  optionsParams: {
    options: string[];
    setOptions: Dispatch<SetStateAction<string[]>>;
  };

  correctAnswerParams: {
    correctAnswer: string | null;
    setCorrectAnswer: Dispatch<SetStateAction<string | null>>;
  };

  qstImageParams: {
    qstImage: string[];
    setQstImage: Dispatch<SetStateAction<string[]>>;
  };

  activeSectionParams: {
    activeSection: [string, number] | null;
    setActiveSection: Dispatch<SetStateAction<[string, number] | null>>;
  };
};

// CSV
export type CsvRow = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  score: string;
};
