"use client";

import Button from "@/components/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { Database, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CollectionKey =
  | "assessments"
  | "students"
  | "courses"
  | "groups"
  | "subGroups"
  | "admins";

type ClearResult = Record<string, number>;

const RESULT_LABELS: Record<string, string> = {
  submissionDrafts: "Submission Drafts",
  violations: "Violations",
  webcamSnapshots: "Webcam Snapshots",
  studentResponses: "Student Responses",
  studentAssessments: "Student Assessments",
  assessments: "Assessments",
  questions: "Questions",
  students: "Students",
  studentUsers: "Student Users",
  courses: "Courses",
  groups: "Groups",
  subGroups: "Sub Groups",
  admins: "Admins",
};

const labelOf = (key: string) =>
  RESULT_LABELS[key] ??
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const COLLECTIONS: {
  id: CollectionKey;
  label: string;
  description: string;
  danger?: boolean;
}[] = [
  {
    id: "assessments",
    label: "Assessments",
    description:
      "Assessments, questions, responses, violations & webcam snapshots",
  },
  {
    id: "students",
    label: "Students",
    description: "Student records and their login accounts",
  },
  { id: "courses", label: "Courses", description: "Course records" },
  { id: "groups", label: "Groups", description: "Group records" },
  { id: "subGroups", label: "Sub Groups", description: "Sub-group records" },
  {
    id: "admins",
    label: "Admins",
    description: "Admin and staff accounts — dangerous, rarely needed",
    danger: true,
  },
];

const DatabaseSetting = () => {
  const [selected, setSelected] = useState<Set<CollectionKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClearResult | null>(null);

  const toggle = (id: CollectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearCollections = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one collection to clear.", toastConfig);
      return;
    }

    const body = Object.fromEntries([...selected].map((k) => [k, true]));

    setResult(null);
    setLoading(true);
    try {
      const api = await getAxios();
      const res = await api.delete("/config/clear-db", { data: body });

      const counts = Object.fromEntries(
        Object.entries(res.data ?? {}).filter(
          ([, v]) => typeof v === "number",
        ),
      ) as ClearResult;

      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

      setResult(counts);
      toast.success(
        `${total.toLocaleString()} record${total === 1 ? "" : "s"} deleted across ${Object.keys(counts).length} collection${Object.keys(counts).length === 1 ? "" : "s"}.`,
        toastConfig,
      );
      setSelected(new Set());
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to clear collections.",
        toastConfig,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Database</div>
      <div className="text-sm text-theme-gray mb-6">
        Permanently delete records from selected collections. This action cannot
        be undone.
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-sm font-medium mb-4">Clear Collections</div>

        <div className="flex flex-col gap-3 mb-6">
          {COLLECTIONS.map((c) => (
            <label key={c.id} className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={selected.has(c.id)}
                onCheckedChange={() => toggle(c.id)}
                className="mt-0.5"
              />
              <div>
                <div
                  className={`text-sm font-medium ${c.danger ? "text-theme-error" : ""}`}
                >
                  {c.label}
                </div>
                <div className="text-xs text-theme-gray">{c.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="w-44">
          <Button
            title="Clear Collections"
            loading={loading}
            variant="fillError"
            type="button"
            onClick={clearCollections}
          />
        </div>
      </div>

      {result && (
        <div className="border rounded-lg overflow-hidden mt-4">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
            <div className="flex items-center gap-2">
              <Database size={14} />
              <span className="text-sm font-medium">Deletion Results</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <Trash2 size={12} />
              {Object.values(result)
                .reduce((sum, n) => sum + n, 0)
                .toLocaleString()}{" "}
              total deleted
            </span>
          </div>

          <div className="p-4">
            {Object.keys(result).length === 0 ? (
              <div className="text-xs text-theme-gray">
                No records were deleted.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result).map(([key, count]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs rounded-md bg-muted/30 px-3 py-2"
                  >
                    <span className="text-theme-gray">{labelOf(key)}</span>
                    <span
                      className={`font-medium tabular-nums ${count > 0 ? "" : "text-theme-gray"}`}
                    >
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-3">
            <button
              className="text-xs text-theme-gray underline cursor-pointer"
              onClick={() => setResult(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetting;
