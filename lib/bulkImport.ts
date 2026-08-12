import { toastConfig } from "@/utils/toastConfig";
import { toast } from "sonner";
import { getAxios } from "./axios";

export type ImportTemplate =
  | "students"
  | "questions"
  | "faculty"
  | "courses"
  | "assign-students"
  | "unassign-students";

const FILE_NAMES: Record<ImportTemplate, string> = {
  students: "students_template.xlsx",
  questions: "questions_template.xlsx",
  faculty: "faculty_template.xlsx",
  courses: "courses_template.xlsx",
  "assign-students": "assign-students-template.xlsx",
  "unassign-students": "unassign-students-template.xlsx",
};

// Downloads a blank import template. Returns false so callers can leave their
// upload dialog open when the download fails.
export const downloadImportTemplate = async (template: ImportTemplate) => {
  try {
    const api = await getAxios();
    const res = await api.get(`/import/template/${template}`, {
      responseType: "blob",
    });

    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAMES[template];
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    // A blob response type turns the error body into a Blob too, so there is
    // no server message to surface here
    toast.error("Failed to download template.", toastConfig);
    return false;
  }
};

// Imports are partial by design — duplicate rows are skipped and bad rows are
// reported, while the rest still land
export type BulkImportResult = {
  created: unknown[];
  skipped: string[];
  errors: string[];
};

export const runBulkImport = async (
  kind: "faculty" | "courses",
  file: File,
): Promise<BulkImportResult | null> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const api = await getAxios();
    const res = await api.post(`/import/${kind}`, formData);

    if (res.status !== 200 && res.status !== 201) return null;

    const data = res.data.data ?? res.data;
    return {
      created: data?.created ?? [],
      skipped: data?.skipped ?? [],
      errors: data?.errors ?? [],
    };
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        "Unable to import the file, please retry.",
      toastConfig,
    );
    return null;
  }
};
