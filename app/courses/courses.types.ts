export type Course = {
  _id: number;
  code: string;
  title: string;
  description: string;
  createdAt: string;
};

export type CoursesPageMetaData = {
  page: number;
  pages: number;
  coursesCount: number;
};
