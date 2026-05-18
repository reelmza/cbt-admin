export interface AssessmentRef {
  id: string;
  title: string;
}

export interface Student {
  id: string;
  fullName: string;
  regNo: string;
  level: number;
}

export interface QuestionOption {
  label: string;
  text: string;
  _id: string;
}

export interface AnswerSlot {
  slotNumber: number;
  possibleAnswers: string[];
  _id: string;
}

export type QuestionType = "multiple_choice" | "subjective" | "theory";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  images: string[];
  options: QuestionOption[];
  correctAnswer: string | null;
  answerSlots: AnswerSlot[];
  expectedAnswer: string | null;
  requiresManualMarking: boolean;
}

export type AnswerStatus = "processing" | "pending" | "marked";

export interface Answer {
  answerId: string;
  question: Question;
  selectedOption: string | null;
  subjectiveAnswers: AnswerSlot[];
  theoryAnswer: string | null;
  score: number;
  status: AnswerStatus;
  isManuallyMarked: boolean;
  markedBy: string | null;
}

export type SubmissionStatus = "completed" | "pending" | "in-progress";

export interface SubmissionDetailResponse {
  assessment: AssessmentRef;
  submissionId: string;
  student: Student;
  status: SubmissionStatus;
  isFullyMarked: boolean;
  totalScore: number;
  percentage: number;
  autoSubmitted: boolean;
  submittedAt: string;
  answers: Answer[];
}
