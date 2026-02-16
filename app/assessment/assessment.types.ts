type AssesmentApiResponse = {
  _id: string;
  title: string;

  course: {
    title: string;
    code: string;
  };
  dueDate: string;
  totalMarks: number;
  status: string;
  students: [];
  sections: [{ questions: [] }];
  endReason: string | null;
  authorizedToStart: boolean;
};
