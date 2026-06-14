"use client";

import Button from "@/components/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import {
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CollectionKey =
  | "assessments"
  | "questions"
  | "students"
  | "users"
  | "courses"
  | "groups"
  | "studentAssessments"
  | "studentResponses"
  | "notifications"
  | "tests"
  | "config"
  | "file"
  | "admin";

type LoadingState =
  | "push-selected"
  | "push-all"
  | "pull-selected"
  | "pull-all"
  | null;

type SyncResult = {
  direction: "push" | "pull";
  succeeded: string[];
  errors: Record<string, string>;
};

const COLLECTIONS: { id: CollectionKey; label: string }[] = [
  { id: "assessments", label: "Assessments" },
  { id: "questions", label: "Questions" },
  { id: "students", label: "Students" },
  { id: "users", label: "Users" },
  { id: "courses", label: "Courses" },
  { id: "groups", label: "Groups" },
  { id: "studentAssessments", label: "Student Assessments" },
  { id: "studentResponses", label: "Student Responses" },
  { id: "notifications", label: "Notifications" },
  { id: "tests", label: "Tests" },
  { id: "config", label: "Config" },
  { id: "file", label: "Files" },
  { id: "admin", label: "Admin" },
];

const labelOf = (id: string) =>
  COLLECTIONS.find((c) => c.id === id)?.label ?? id;

const BackupSetting = () => {
  const [selected, setSelected] = useState<Set<CollectionKey>>(new Set());
  const [loading, setLoading] = useState<LoadingState>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const toggle = (id: CollectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSyncSelected = async (direction: "push" | "pull") => {
    if (selected.size === 0) {
      toast.error("Select at least one collection to sync.", toastConfig);
      return;
    }

    setSyncResult(null);
    setLoading(direction === "push" ? "push-selected" : "pull-selected");

    const base =
      direction === "push" ? "/config/admin/sync" : "/config/admin/pull";
    const errors: Record<string, string> = {};
    const succeeded: string[] = [];

    const api = await getAxios();

    await Promise.allSettled(
      [...selected].map(async (collection) => {
        try {
          await api.post(`${base}/${collection}`, {});
          succeeded.push(collection);
        } catch (err: any) {
          errors[collection] =
            err?.response?.data?.message || "Request failed";
        }
      })
    );

    setLoading(null);
    setSyncResult({ direction, succeeded, errors });

    const errorCount = Object.keys(errors).length;
    if (errorCount > 0 && succeeded.length > 0) {
      toast.warning(
        `${succeeded.length} synced, ${errorCount} failed.`,
        toastConfig
      );
    } else if (errorCount > 0) {
      toast.error("All selected collections failed to sync.", toastConfig);
    } else {
      toast.success(
        `${succeeded.length} collection(s) ${direction === "push" ? "pushed to cloud" : "pulled from cloud"} successfully.`,
        toastConfig
      );
    }
  };

  const handleSyncAll = async (direction: "push" | "pull") => {
    setSyncResult(null);
    setLoading(direction === "push" ? "push-all" : "pull-all");

    const allIds = COLLECTIONS.map((c) => c.id);
    const endpoint =
      direction === "push"
        ? "/config/admin/sync-all"
        : "/config/admin/pull-all";

    try {
      const api = await getAxios();
      const res = await api.post(endpoint, {});
      const data = res.data;

      const errors: Record<string, string> = data.errors ?? {};
      const errorKeys = Object.keys(errors);
      const succeeded = allIds.filter((id) => !errorKeys.includes(id));

      setSyncResult({ direction, succeeded, errors });

      if (errorKeys.length > 0) {
        toast.warning(
          data.message ||
            `${succeeded.length} synced, ${errorKeys.length} failed.`,
          toastConfig
        );
      } else {
        toast.success(
          data.message || "All collections synced successfully.",
          toastConfig
        );
      }
    } catch (err: any) {
      const responseData = err?.response?.data;
      const isCollectionErrors =
        responseData &&
        typeof responseData === "object" &&
        !responseData.message &&
        Object.values(responseData).every((v) => typeof v === "string");

      if (isCollectionErrors) {
        const errorKeys = Object.keys(responseData);
        const succeeded = allIds.filter((id) => !errorKeys.includes(id));
        setSyncResult({ direction, succeeded, errors: responseData });
        toast.error(
          `${direction === "push" ? "Push" : "Pull"} failed for ${errorKeys.length} collection(s).`,
          toastConfig
        );
      } else {
        toast.error(
          responseData?.message || `Failed to ${direction} all collections.`,
          toastConfig
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;
  const errorCount = syncResult ? Object.keys(syncResult.errors).length : 0;
  const successCount = syncResult?.succeeded.length ?? 0;
  const total = successCount + errorCount;

  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Backup & Sync</div>
      <div className="text-sm text-theme-gray mb-6">
        Synchronize data between the local exam server and the cloud platform.
        Timestamp-based conflict resolution ensures the most recent record
        always wins.
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-1">Collections</div>
        <div className="text-xs text-theme-gray mb-4">
          Select collections to push or pull individually.
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {COLLECTIONS.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <Checkbox
                checked={selected.has(c.id)}
                onCheckedChange={() => toggle(c.id)}
                disabled={isLoading}
              />
              <span className="text-sm">{c.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            title="Push Selected"
            loading={loading === "push-selected"}
            variant="fill"
            type="button"
            icon={<CloudUpload size={15} />}
            onClick={() => handleSyncSelected("push")}
          />
          <Button
            title="Pull Selected"
            loading={loading === "pull-selected"}
            variant="outline"
            type="button"
            icon={<CloudDownload size={15} />}
            onClick={() => handleSyncSelected("pull")}
          />
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-1">Full Sync</div>
        <div className="text-xs text-theme-gray mb-4">
          Synchronize all collections at once. Requires Superadmin
          authorization.
        </div>

        <div className="flex gap-3">
          <Button
            title="Push All"
            loading={loading === "push-all"}
            variant="fill"
            type="button"
            icon={<CloudUpload size={15} />}
            onClick={() => handleSyncAll("push")}
          />
          <Button
            title="Pull All"
            loading={loading === "pull-all"}
            variant="outline"
            type="button"
            icon={<CloudDownload size={15} />}
            onClick={() => handleSyncAll("pull")}
          />
        </div>
      </div>

      {syncResult && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
            <div className="flex items-center gap-2">
              {syncResult.direction === "push" ? (
                <CloudUpload size={14} />
              ) : (
                <CloudDownload size={14} />
              )}
              <span className="text-sm font-medium">
                {syncResult.direction === "push" ? "Push" : "Pull"} Results
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={12} />
                  {successCount} succeeded
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle size={12} />
                  {errorCount} failed
                </span>
              )}
              <span className="text-theme-gray">{total} total</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {successCount > 0 && (
              <div>
                <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1.5">
                  Synced successfully
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {syncResult.succeeded.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                    >
                      <CheckCircle2 size={10} />
                      {labelOf(id)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errorCount > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">
                  <AlertTriangle size={12} />
                  Failed collections
                </div>
                <div className="flex flex-col gap-1">
                  {Object.entries(syncResult.errors).map(([id, message]) => (
                    <div
                      key={id}
                      className="flex items-start gap-2 text-xs rounded-md bg-amber-50 dark:bg-amber-950/20 px-3 py-2"
                    >
                      <XCircle
                        size={12}
                        className="text-red-500 mt-0.5 shrink-0"
                      />
                      <span className="font-medium text-amber-800 dark:text-amber-300 min-w-fit">
                        {labelOf(id)}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400">
                        {message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pb-3">
            <button
              className="text-xs text-theme-gray underline cursor-pointer"
              onClick={() => setSyncResult(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupSetting;
