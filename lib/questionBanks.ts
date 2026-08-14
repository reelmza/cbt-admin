import { toastConfig } from "@/utils/toastConfig";
import { toast } from "sonner";
import { getAxios } from "./axios";

/*
 * Every question bank network call lives here so the builder components stay
 * pure UI. Each function resolves to its payload, or to null/false when the
 * request failed — the toast is raised here, callers only decide what to render.
 */

export type BankQuestion = {
  _id: string;
  question: string;
  type: string;
  score?: number;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  correctAnswers?: string[];
  expectedAnswer?: string;
  answerSlots?: { slotNumber: number; possibleAnswers: string[] }[];
  // Questions carry both shapes: `image` is the comma-joined string the create
  // form writes, `images` the array on the schema. Either may hold URLs.
  image?: string;
  images?: string[];
};

export const questionImages = (question: BankQuestion) => [
  ...new Set([
    ...(question.image ? question.image.split(",").filter(Boolean) : []),
    ...(question.images ?? []),
  ]),
];

export type QuestionBank = {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  createdAt?: string;
  // Only the detail endpoint returns the questions themselves
  questions?: BankQuestion[];
  questionCount?: number;
  questionsCount?: number;
};

export type AssessmentSummary = {
  _id: string;
  title: string;
  session?: string;
  status?: string;
};

/*
 * Where a question in the builder came from. The API stores no provenance, so
 * this is tracked client-side and only reflects the current session — anything
 * already saved in the bank when it loads is simply "saved".
 */
export type QuestionOrigin = "created" | "assessment" | "bank" | "saved";

// A question as the builder holds it: the saved document plus where it came from
export type BuilderQuestion = BankQuestion & { origin: QuestionOrigin };

export const ORIGIN_LABELS: Record<QuestionOrigin, string> = {
  created: "Created here",
  assessment: "From assessment",
  bank: "From question bank",
  saved: "Already in bank",
};

// The four question shapes the builder can create, using the same wording and
// values as the section types on /assessment/create
export const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Objective" },
  { value: "multiple_select", label: "Multiple Select" },
  { value: "subjective", label: "Subjective" },
  { value: "theory", label: "Theory" },
];

export const questionTypeLabel = (type: string) =>
  QUESTION_TYPES.find((item) => item.value === type)?.label ?? type;

// Option labels are positional across every objective-style question
export const OPTION_LABELS = ["A", "B", "C", "D"];

// Responses nest their payload under data.data, but the key inside differs per
// route, so fall back to the wrapper itself when the expected key is missing
const unwrap = (res: any, key: string) =>
  res?.data?.data?.[key] ?? res?.data?.data;

const isAborted = (error: any) =>
  error?.name === "CanceledError" || error?.code === "ERR_CANCELED";

const reportError = (error: any, fallback: string) => {
  if (isAborted(error)) return;
  toast.error(error?.response?.data?.message || fallback, toastConfig);
};

export const listQuestionBanks = async ({
  search,
  subject,
  page,
  signal,
}: {
  search?: string;
  subject?: string;
  page: number;
  signal?: AbortSignal;
}) => {
  const query = new URLSearchParams({ pageNumber: String(page) });
  if (search) query.set("search", search);
  if (subject) query.set("subject", subject);

  try {
    const api = await getAxios();
    const res = await api.get(`/admin/question-banks?${query.toString()}`, {
      signal,
    });

    const data = res?.data?.data;
    return {
      banks: (data?.banks ?? []) as QuestionBank[],
      page: data?.page ?? 1,
      pages: data?.pages ?? 1,
      total: data?.total ?? 0,
    };
  } catch (error: any) {
    reportError(error, "Unable to load question banks, please retry.");
    return null;
  }
};

export const getQuestionBank = async (id: string, signal?: AbortSignal) => {
  try {
    const api = await getAxios();
    const res = await api.get(`/admin/question-banks/${id}`, { signal });
    return unwrap(res, "bank") as QuestionBank;
  } catch (error: any) {
    reportError(error, "Unable to load this question bank, please retry.");
    return null;
  }
};

export const createQuestionBank = async (payload: {
  title: string;
  subject: string;
  description: string;
}) => {
  try {
    const api = await getAxios();
    const res = await api.post("/admin/question-banks", payload);
    return unwrap(res, "bank") as QuestionBank;
  } catch (error: any) {
    reportError(error, "Unable to create the question bank, please retry.");
    return null;
  }
};

export const addQuestionsToBank = async (
  bankId: string,
  questionIds: string[],
) => {
  try {
    const api = await getAxios();
    await api.post(`/admin/question-banks/${bankId}/questions`, {
      questionIds,
    });
    return true;
  } catch (error: any) {
    reportError(error, "Unable to add the questions, please retry.");
    return false;
  }
};

export const removeQuestionsFromBank = async (
  bankId: string,
  questionIds: string[],
) => {
  try {
    const api = await getAxios();
    // The ids travel in the body, which axios only sends for DELETE via `data`
    await api.delete(`/admin/question-banks/${bankId}/questions`, {
      data: { questionIds },
    });
    return true;
  } catch (error: any) {
    reportError(error, "Unable to remove the question, please retry.");
    return false;
  }
};

/*
 * Creates a standalone question, unattached to any assessment. The response
 * carries the new ObjectId, which is what the bank endpoints accept.
 *
 * `admin` is required in the body — the route does not read it off the token —
 * and the payload is returned bare under `data`, not wrapped under a key, so
 * `unwrap` must not be used here: `data.question` is the question *text*.
 */
export const createQuestion = async (
  adminId: string,
  payload: Record<string, unknown>,
) => {
  try {
    const api = await getAxios();
    const res = await api.post("/admin/create-question", {
      ...payload,
      admin: adminId,
    });
    return (res?.data?.data ?? null) as BankQuestion | null;
  } catch (error: any) {
    reportError(error, "Unable to save the question, please retry.");
    return null;
  }
};

/*
 * Copies questions out of a bank into one section of an existing assessment.
 * `sectionIndex` is 0-based, so the assessment has to be created first — pass
 * `questionIds` to move a subset, omit it to move the whole bank.
 */
export const importBankIntoSection = async ({
  bankId,
  assessmentId,
  sectionIndex,
  questionIds,
}: {
  bankId: string;
  assessmentId: string;
  sectionIndex: number;
  questionIds?: string[];
}) => {
  try {
    const api = await getAxios();
    const res = await api.post(
      `/admin/question-banks/${bankId}/import/${assessmentId}/${sectionIndex}`,
      questionIds ? { questionIds } : {},
    );

    const data = res?.data?.data;
    return {
      imported: (data?.imported ?? 0) as number,
      skipped: (data?.skipped ?? 0) as number,
    };
  } catch (error: any) {
    reportError(error, "Unable to import the bank questions, please retry.");
    return null;
  }
};

export const listAssessments = async (
  search: string,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);

  try {
    const api = await getAxios();
    const res = await api.get(`/admin/assessments?${query.toString()}`, {
      signal,
    });
    return (unwrap(res, "assessments") ?? []) as AssessmentSummary[];
  } catch (error: any) {
    reportError(error, "Unable to load assessments, please retry.");
    return null;
  }
};

export const getAssessmentQuestions = async (
  assessmentId: string,
  signal?: AbortSignal,
) => {
  try {
    const api = await getAxios();
    const res = await api.get(`/admin/questions/${assessmentId}`, { signal });
    return (unwrap(res, "questions") ?? []) as BankQuestion[];
  } catch (error: any) {
    reportError(error, "Unable to load the assessment questions, retry.");
    return null;
  }
};
