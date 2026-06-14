"use client";

import Button from "@/components/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { useState } from "react";
import { toast } from "sonner";

type CollectionKey =
  | "assessments"
  | "students"
  | "courses"
  | "groups"
  | "subGroups"
  | "admins";

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

    setLoading(true);
    try {
      const api = await getAxios();
      const res = await api.delete("/config/clear-db", { data: body });
      toast.success(
        res.data.message || "Collections cleared successfully.",
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
    </div>
  );
};

export default DatabaseSetting;
