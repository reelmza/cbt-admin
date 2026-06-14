"use client";

import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";
import { ArrowLeft, Radio, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type AssignedStudent = {
  id: string;
  fullName: string;
  regNumber: string;
  status: string;
  violationCount: number;
  connectionStatus?: "online" | "offline";
};

type AssessmentStats = {
  total: number;
  submitted: number;
  inProgress: number;
  stillWriting: number;
  locked: number;
};

type MonitoringAssessment = {
  _id: string;
  title: string;
  course: { title: string; code: string };
  stats: AssessmentStats;
  assignedStudents: AssignedStudent[];
};

type Violation = {
  _id: string;
  violationType: string;
  violationDetails: string;
  isPardoned: boolean;
  createdAt: string;
  student?: { _id: string; fullName: string; regNumber: string; level: number };
};

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) => (
  <div className="flex-1 min-w-0 border border-theme-gray-mid rounded-xl px-5 py-4">
    <div className={`text-2xl font-bold ${accent ?? "text-accent-dim"}`}>
      {value}
    </div>
    <div className="text-xs text-theme-gray mt-1">{label}</div>
  </div>
);

const studentStatusBadgeColor = (
  status: string,
): "success" | "info" | "warning" | "error" => {
  if (status === "submitted") return "success";
  if (status === "in-progress") return "info";
  if (status === "locked") return "error";
  if (status === "disconnected") return "warning";
  return "warning";
};

const Page = ({ assessmentId }: { assessmentId: string }) => {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<MonitoringAssessment | null>(
    null,
  );
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [progressMap, setProgressMap] = useState<
    Record<string, { answered: number; total: number }>
  >({});

  // Violations modal state
  const [violationsOpen, setViolationsOpen] = useState(false);
  const [violationsStudent, setViolationsStudent] =
    useState<AssignedStudent | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [pardoningIds, setPardoningIds] = useState<Set<string>>(new Set());
  const [pardonCodes, setPardonCodes] = useState<Record<string, string>>({});

  const pardonViolation = async (violationId: string) => {
    setPardoningIds((prev) => new Set(prev).add(violationId));
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/assessment/violations/${violationId}/pardon`,
      );
      if (res.status === 200 || res.status === 201) {
        const code =
          res.data.data?.pardonCode ??
          res.data.pardonCode ??
          res.data.data?.code ??
          res.data.code ??
          "—";
        setPardonCodes((prev) => ({ ...prev, [violationId]: code }));
        setViolations((prev) =>
          prev.map((v) =>
            v._id === violationId ? { ...v, isPardoned: true } : v,
          ),
        );
      }
    } catch {
      // leave button available to retry
    } finally {
      setPardoningIds((prev) => {
        const next = new Set(prev);
        next.delete(violationId);
        return next;
      });
    }
  };

  const openViolations = async (student: AssignedStudent) => {
    setViolationsStudent(student);
    setViolations([]);
    setPardonCodes({});
    setPardoningIds(new Set());
    setViolationsOpen(true);
    setViolationsLoading(true);
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/violations/${assessmentId}?studentId=${student.id}`,
      );
      if (res.status === 200 || res.status === 201) {
        setViolations(res.data.data ?? res.data.violations ?? []);
      }
    } catch {
      setViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  // Fetch initial assessment data
  useEffect(() => {
    if (!session?.user.token) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        const res = await api.get(
          "/assessment/my-invigilator-assessments",
          { signal: controller.signal },
        );

        if (res.status === 200 || res.status === 201) {
          const raw = res.data.data;
          const list: MonitoringAssessment[] = Array.isArray(raw) ? raw : [raw];
          const match = list.find((a) => a._id === assessmentId);

          if (match) {
            setAssessment(match);
            setStudents(
              match.assignedStudents.map((s) => ({
                ...s,
                connectionStatus: "offline" as const,
              })),
            );
            setStats(match.stats);
          } else {
            setErrorMessage(
              "Not Found$This assessment was not found in your assigned list.",
            );
          }
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          if (error?.status === 403) {
            setErrorMessage(
              "Access Denied$You are not authorized to access this resource.",
            );
          }
          setLoading("pageError");
        }
      }
    };

    getData();

    return () => {
      controller.abort();
    };
  }, [session?.user.token]);

  // Initialize socket once after session is available
  useEffect(() => {
    if (socketRef.current) return;
    if (!session?.user?.id) return;

    socketRef.current = true as any;
    let cancelled = false;

    const initSocket = async () => {
      const res = await fetch(`${window.location.origin}/api/config`);
      const { baseUrl } = await res.json();
      const socketUrl = new URL(baseUrl).origin;

      if (cancelled) {
        socketRef.current = null;
        return;
      }

      const socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket"],
        query: {
          token: `Bearer ${session.user.token}`,
        },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("monitor-assessment", assessmentId);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      socket.on(
        "candidate-joined",
        ({ studentId, name }: { studentId: string; name: string }) => {
          console.log(name, "joined", studentId);
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    status: "in-progress",
                    connectionStatus: "online" as const,
                  }
                : s,
            ),
          );
        },
      );

      socket.on(
        "candidate-disconnected",
        ({ studentId, name }: { studentId: string; name: string }) => {
          console.log("candidate-disconnected", name, studentId);
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    status: "disconnected",
                    connectionStatus: "offline" as const,
                  }
                : s,
            ),
          );
        },
      );

      socket.on(
        "candidate-alert",
        (data: {
          type: string;
          socketId: string;
          count: number;
          studentId: string;
          timestamp: string;
        }) => {
          console.log(data);
          setStudents((prev) =>
            prev.map((s) =>
              s.id === data.studentId
                ? { ...s, violationCount: s.violationCount + 1 }
                : s,
            ),
          );
        },
      );

      socket.on(
        "candidate-locked",
        ({ studentId }: { studentId: string; reason: string }) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId ? { ...s, status: "locked" } : s,
            ),
          );
          setStats((prev) =>
            prev ? { ...prev, locked: prev.locked + 1 } : prev,
          );
        },
      );

      socket.on(
        "candidate-unlocked",
        ({ studentId }: { studentId: string }) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId ? { ...s, status: "in-progress" } : s,
            ),
          );
          setStats((prev) =>
            prev ? { ...prev, locked: Math.max(0, prev.locked - 1) } : prev,
          );
        },
      );

      socket.on(
        "candidate-progress",
        ({
          socketId,
          studentId,
          answered,
          total,
        }: {
          socketId: string;
          studentId: string;
          answered: number;
          total: number;
        }) => {
          setProgressMap((prev) => ({
            ...prev,
            [studentId]: { answered, total },
          }));
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    status: "in-progress",
                    connectionStatus: "online" as const,
                  }
                : s,
            ),
          );
        },
      );

      socket.on(
        "candidate-auto-submitted",
        ({
          studentId,
          violationCount,
        }: {
          studentId: string;
          reason: string;
          violationCount: number;
        }) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? { ...s, status: "submitted", violationCount }
                : s,
            ),
          );
          setStats((prev) =>
            prev ? { ...prev, submitted: prev.submitted + 1 } : prev,
          );
        },
      );

      socket.on(
        "candidate-submitted",
        ({
          studentId,
        }: {
          studentId: string;
          assessmentId: string;
          timestamp: string;
        }) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId ? { ...s, status: "submitted" } : s,
            ),
          );
          setStats((prev) =>
            prev ? { ...prev, submitted: prev.submitted + 1 } : prev,
          );
        },
      );
    };

    initSocket();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        if (socket.connected) {
          socket.disconnect();
        } else {
          socket.once("connect", () => socket.disconnect());
        }
      }
    };
  }, [session?.user.id]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {assessment && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/invigilator"
                className="flex items-center justify-center w-8 h-8 rounded-md border border-theme-gray-mid hover:bg-theme-gray-light transition-colors"
              >
                <ArrowLeft size={16} className="text-theme-gray" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-accent text-white rounded px-2 py-0.5">
                    {assessment.course?.code}
                  </span>
                  <span className="text-lg font-bold text-accent-dim">
                    {assessment.course?.title ?? assessment.title}
                  </span>
                </div>
                <div className="text-xs text-theme-gray mt-0.5">
                  Live Monitoring
                </div>
              </div>
            </div>

            {/* Connection status */}
            <div
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                connected
                  ? "bg-theme-success/10 text-theme-succes border-theme-success/20"
                  : "bg-theme-gray-light text-theme-gray border-theme-gray-mid"
              }`}
            >
              <Radio size={12} className={connected ? "animate-pulse" : ""} />
              {connected ? "Live" : "Connecting…"}
            </div>
          </div>

          <Spacer size="xl" />

          {/* Stats */}
          {stats && (
            <div className="flex gap-4">
              <StatCard label="Total Students" value={stats.total} />
              <StatCard
                label="Submitted"
                value={stats.submitted}
                accent="text-theme-succes"
              />
              <StatCard
                label="Online"
                value={
                  students.filter((s) => s.connectionStatus === "online").length
                }
                accent="text-theme-info"
              />
              <StatCard
                label="Have Started"
                value={
                  students.filter((s) => s.status === "in-progress").length
                }
                accent="text-theme-info"
              />
              <StatCard
                label="Locked"
                value={stats.locked}
                accent="text-theme-error"
              />
            </div>
          )}

          <Spacer size="xl" />

          {/* Student Table */}
          <Table
            tableHeading={[
              { value: "Full Name", colSpan: "col-span-3" },
              { value: "Reg Number", colSpan: "col-span-2" },
              { value: "Started?", colSpan: "col-span-2" },
              { value: "Con.", colSpan: "col-span-1" },
              { value: "Progress", colSpan: "col-span-2" },
              { value: "Violations", colSpan: "col-span-2" },
            ]}
            tableData={students.map((student) => {
              const progress = progressMap[student.id];
              return [
                { value: student.fullName, colSpan: "col-span-3" },
                { value: student.regNumber, colSpan: "col-span-2" },
                {
                  value:
                    student.status === "in-progress" ? "yes" : student.status,
                  colSpan: "col-span-2",
                  type: "badge" as const,
                  color: studentStatusBadgeColor(student.status),
                },
                {
                  value: student.connectionStatus ?? "offline",
                  colSpan: "col-span-1",
                  type: "badge" as const,
                  color:
                    student.connectionStatus === "online"
                      ? ("success" as const)
                      : ("error" as const),
                },
                {
                  value: progress
                    ? `${progress.answered} / ${progress.total}`
                    : "—",
                  colSpan: "col-span-2",
                },
                {
                  colSpan: "col-span-2",
                  render: () => (
                    <button
                      onClick={() => openViolations(student)}
                      className={`flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${
                        student.violationCount > 0
                          ? "text-theme-error hover:opacity-70"
                          : "text-theme-gray hover:text-accent"
                      }`}
                    >
                      <span>({student.violationCount}) View Details</span>
                    </button>
                  ),
                },
              ];
            })}
            showSearch={false}
            showOptions={false}
          />

          <Spacer size="xl" />
          <Spacer size="xl" />

          {/* Violations Modal */}
          <Dialog open={violationsOpen} onOpenChange={setViolationsOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Violation Details</DialogTitle>
                {violationsStudent && (
                  <p className="text-sm text-theme-gray pt-1">
                    {violationsStudent.fullName} &mdash;{" "}
                    {violationsStudent.regNumber}
                  </p>
                )}
              </DialogHeader>

              {violationsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="size-5" />
                </div>
              ) : violations.length === 0 ? (
                <div className="py-8 text-center text-sm text-theme-gray">
                  No violations recorded.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                  {violations.map((v, i) => (
                    <div
                      key={v._id ?? i}
                      className="flex flex-col gap-2 rounded-md border border-theme-gray-mid px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert
                            size={14}
                            className={`shrink-0 ${v.isPardoned ? "text-theme-gray" : "text-theme-error"}`}
                          />
                          <span className="text-sm capitalize">
                            {v.violationType?.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-xs text-theme-gray whitespace-nowrap">
                            {v.createdAt
                              ? new Date(v.createdAt).toLocaleTimeString()
                              : "—"}
                          </span>
                          {!v.isPardoned ? (
                            <button
                              onClick={() => pardonViolation(v._id)}
                              disabled={pardoningIds.has(v._id)}
                              className="text-xs font-medium text-accent hover:opacity-70 disabled:opacity-40 transition-opacity whitespace-nowrap"
                            >
                              {pardoningIds.has(v._id)
                                ? "Pardoning…"
                                : "Pardon"}
                            </button>
                          ) : (
                            <span className="text-xs text-theme-gray">
                              pardoned
                            </span>
                          )}
                        </div>
                      </div>
                      {pardonCodes[v._id] && (
                        <div className="flex items-center gap-2 bg-theme-gray-light rounded px-3 py-1.5">
                          <span className="text-xs text-theme-gray">
                            Pardon code:
                          </span>
                          <span className="text-xs font-mono font-semibold text-accent-dim">
                            {pardonCodes[v._id]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      <Preload
        loading={loading}
        pageData={assessment ? true : false}
        errorMessage={errorMessage}
      />
    </div>
  );
};

const PageWrapper = ({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) => {
  const { assessmentId } = use(params);
  return (
    <SessionProvider>
      <Page assessmentId={assessmentId} />
    </SessionProvider>
  );
};

export default PageWrapper;
