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
  endReason: string;
};
