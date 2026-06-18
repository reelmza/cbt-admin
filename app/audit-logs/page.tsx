"use client";

import Spacer from "@/components/spacer";
import Table from "@/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { ArrowRight } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Preload from "@/components/preload";
import { AuditLog, AuditLogsMeta } from "./audit-logs.types";

const ACTION_FILTERS = [
  "focus-lost",
  "reconnect",
  "create",
  "update",
  "pardon-applied",
] as const;

const LIMIT = 50;

const actionColor = (
  action: string,
): "warning" | "info" | "success" | "error" => {
  switch (action) {
    case "create":
    case "reconnect":
      return "info";
    case "update":
      return "warning";
    case "pardon-applied":
      return "success";
    case "focus-lost":
      return "error";
    default:
      return "info";
  }
};

const Page = () => {
  const [loading, setLoading] = useState<string | null>("page");
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [meta, setMeta] = useState<AuditLogsMeta | null>(null);
  const [filterAction, setFilterAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchControllerRef = useRef<AbortController | null>(null);

  const { data: session } = useSession();

  const fetchLogs = async ({
    action,
    page,
    loadingKey = "fetchLogs",
  }: {
    action: string;
    page: number;
    loadingKey?: string;
  }) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(loadingKey);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (action) query.set("action", action);

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/audit-logs?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 200) {
        const { logs, ...rest } = res.data.data;
        setLogs(logs);
        setMeta(rest);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        toast.error("Failed to load audit logs.", toastConfig);
      }
    }
  };

  const getPage = (dir: string) => {
    if (!meta?.page) return;
    const targetPage = dir === "next" ? meta.page + 1 : meta.page - 1;
    if (targetPage < 1 || targetPage > meta.pages) return;
    fetchLogs({
      action: filterAction,
      page: targetPage,
      loadingKey: dir === "next" ? "nextPage" : "prevPage",
    });
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    !logs && fetchLogs({ action: "", page: 1, loadingKey: "page" });
  }, [session?.user?.id]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {logs && meta && (
        <>
          <h1 className="text-xl font-serif font-bold text-accent-dim">
            Audit Logs
          </h1>
          <Spacer size="lg" />

          {/* Filters & Pagination */}
          <div className="flex items-center justify-between">
            <Select
              value={filterAction || "all"}
              onValueChange={(val) => {
                const newAction = val === "all" ? "" : val;
                setFilterAction(newAction);
                fetchLogs({ action: newAction, page: 1, loadingKey: "search" });
              }}
            >
              <SelectTrigger className="w-48 h-9 text-sm">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_FILTERS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <button
                className="flex items-center justify-center gap-2 h-9 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm disabled:opacity-50"
                onClick={() => getPage("prev")}
                disabled={meta.page <= 1 || loading === "prevPage"}
              >
                <span>Previous</span>
                {loading === "prevPage" ? <Spinner className="size-4" /> : ""}
              </button>
              <div className="text-sm">
                Page {meta.page} of {meta.pages} {`(${meta.total})`}
              </div>
              <button
                className="flex items-center justify-center gap-2 h-9 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm disabled:opacity-50"
                onClick={() => getPage("next")}
                disabled={meta.page >= meta.pages || loading === "nextPage"}
              >
                <span>Next</span>
                {loading === "nextPage" ? <Spinner className="size-4" /> : ""}
              </button>
            </div>
          </div>
          <Spacer size="sm" />

          {/* Table */}
          <Table
            tableHeading={[
              { value: "Actor", colSpan: "col-span-3" },
              { value: "Action", colSpan: "col-span-2" },
              { value: "Entity", colSpan: "col-span-2" },
              { value: "IP Address", colSpan: "col-span-2" },
              { value: "Date", colSpan: "col-span-2" },
              { value: "", colSpan: "col-span-1" },
            ]}
            tableData={logs.map((item) => [
              {
                value: item.actor?.fullName || "System",
                colSpan: "col-span-3",
              },
              {
                value: item.action,
                colSpan: "col-span-2",
                type: "badge" as const,
                color: actionColor(item.action),
              },
              { value: item.entity || "-", colSpan: "col-span-2" },
              { value: item.ip || "-", colSpan: "col-span-2" },
              {
                value: prettyDate(item.createdAt.split("T")[0]) || "-",
                colSpan: "col-span-2",
              },
              {
                colSpan: "col-span-1",
                render: () => (
                  <button
                    type="button"
                    onClick={() => setSelectedLog(item)}
                    className="flex items-center justify-center gap-1 cursor-pointer hover:text-theme-info"
                  >
                    <span>View</span>
                    <ArrowRight size={14} />
                  </button>
                ),
              },
            ])}
            showSearch={false}
            showOptions={false}
          />

          <Spacer size="xl" />
          <Spacer size="xl" />

          {/* Detail Modal */}
          <Dialog
            open={!!selectedLog}
            onOpenChange={(open) => !open && setSelectedLog(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogDescription>
                  Full record of the selected action.
                </DialogDescription>
              </DialogHeader>

              {selectedLog && (
                <div className="flex flex-col divide-y divide-theme-gray-light text-sm">
                  <DetailRow label="Log ID" value={selectedLog._id} />
                  <DetailRow
                    label="Actor"
                    value={selectedLog.actor?.fullName || "System"}
                  />
                  {selectedLog.actor?.email && (
                    <DetailRow label="Email" value={selectedLog.actor.email} />
                  )}
                  <DetailRow
                    label="Actor Role"
                    value={selectedLog.actorRole}
                  />
                  <DetailRow label="Action" value={selectedLog.action} />
                  <DetailRow label="Entity" value={selectedLog.entity} />
                  {selectedLog.entityId && (
                    <DetailRow
                      label="Entity ID"
                      value={selectedLog.entityId}
                    />
                  )}
                  <DetailRow label="Detail" value={selectedLog.detail} />
                  {selectedLog.ip && (
                    <DetailRow label="IP Address" value={selectedLog.ip} />
                  )}
                  <DetailRow
                    label="Created At"
                    value={new Date(selectedLog.createdAt).toLocaleString()}
                  />
                  <DetailRow
                    label="Updated At"
                    value={new Date(selectedLog.updatedAt).toLocaleString()}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      <Preload
        loading={loading}
        pageData={logs ? true : false}
        errorMessage="Unable to load audit logs$Please check your connection and try again."
      />
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-4 py-2">
    <span className="w-28 shrink-0 text-theme-gray">{label}</span>
    <span className="grow break-all text-foreground">{value}</span>
  </div>
);

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default PageWrapper;
