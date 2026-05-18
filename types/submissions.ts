export interface Submission {
  submissionId: string;
  studentId: string;
  fullName: string;
  regNo: string;
  level: number;
  status: "completed" | "pending" | "in-progress";
  isFullyMarked: boolean;
  totalScore: number;
  percentage: number;
}

export interface Assessment {
  id: string;
  title: string;
}

export interface AssessmentSubmissionsResponse {
  assessment: Assessment;
  total: number;
  submissions: Submission[];
}
