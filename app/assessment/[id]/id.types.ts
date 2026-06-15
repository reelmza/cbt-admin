export type PageDataType = {
  course: {
    code: string;
    title: string;
  };
  status: string;
  totalMarks: number;
  timeLimit: number;
  authorizedToStart: boolean;
  sections: { questions: [] }[];
  endReason: string | boolean;
  dueDate: string;
  startDate: string;
  shuffleQuestions: string[];
  allowBrowserRestriction: boolean;
  passmark: number;
  invigilators: string[];
  createdBy: string;
};
