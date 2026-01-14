type AssesmentApiResponse = {
  title: string;
  dueDate: string;
  totalMarks: number;
  status: string;
  students: [];
  sections: [{ questions: [] }];
};
