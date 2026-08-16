"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Preload from "@/components/preload";
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
import { toastConfig } from "@/utils/toastConfig";
import {
  ArrowLeft,
  FileSpreadsheet,
  Flag,
  Radio,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { FormEvent, use, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

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

// Per-student device and lock detail, reported only by the invigilator
// analytics endpoint
type LiveStudent = {
  studentId: string;
  deviceIp?: string;
  isLocked?: boolean;
  lockReason?: string | null;
  lockedAt?: string | null;
};

type ViolationFilter = { isPardoned: string; violationType: string };

const EMPTY_FILTER: ViolationFilter = { isPardoned: "", violationType: "" };

// Values accepted by the violationType query parameter. These are the raw
// UPPER_SNAKE tokens the student client reports (e.g. "COPY"), not the human
// labels — the integration guide lists the labels, which do not match.
const VIOLATION_TYPES = [
  { value: "TAB_SWITCH", label: "Tab Switch" },
  { value: "WINDOW_BLUR", label: "Window Focus Lost" },
  { value: "COPY", label: "Copy Attempt" },
  { value: "CUT", label: "Cut Attempt" },
  { value: "PASTE", label: "Paste Attempt" },
  { value: "RIGHT_CLICK", label: "Right Click" },
  { value: "KEYBOARD_SHORTCUT", label: "Suspicious Shortcut" },
  { value: "FULLSCREEN_EXIT", label: "Fullscreen Exit" },
  { value: "PHYSICAL_MALPRACTICE", label: "Physical Malpractice" },
];

// Builds the violations query. studentId is passed for the modal, where every
// request stays pinned to one student regardless of the other filters.
const violationQuery = (filter: ViolationFilter, studentId?: string) => {
  const query = new URLSearchParams();
  if (studentId) query.set("studentId", studentId);
  if (filter.isPardoned) query.set("isPardoned", filter.isPardoned);
  if (filter.violationType) query.set("violationType", filter.violationType);
  return query.toString();
};

const isFilterActive = (filter: ViolationFilter) =>
  Boolean(filter.isPardoned || filter.violationType);

const ViolationFilters = ({
  filter,
  onChange,
  loading,
}: {
  filter: ViolationFilter;
  onChange: (next: ViolationFilter) => void;
  loading?: boolean;
}) => (
  <div className="flex items-center gap-2">
    {/* Pardon status */}
    <Select
      value={filter.isPardoned || "all"}
      onValueChange={(val) =>
        onChange({ ...filter, isPardoned: val === "all" ? "" : val })
      }
    >
      <SelectTrigger className="w-40 h-9 text-sm text-theme-gray bg-white rounded-xl">
        <SelectValue placeholder="All Violations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Violations</SelectItem>
        <SelectItem value="true">Pardoned</SelectItem>
        <SelectItem value="false">Unpardoned</SelectItem>
      </SelectContent>
    </Select>

    {/* Violation type */}
    <Select
      value={filter.violationType || "all"}
      onValueChange={(val) =>
        onChange({ ...filter, violationType: val === "all" ? "" : val })
      }
    >
      <SelectTrigger className="w-48 h-9 text-sm text-theme-gray bg-white rounded-xl">
        <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {VIOLATION_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {loading && <Spinner className="size-4 text-theme-gray" />}

    {isFilterActive(filter) && (
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTER)}
        className="text-sm text-theme-gray hover:text-accent cursor-pointer underline underline-offset-2"
      >
        Clear
      </button>
    )}
  </div>
);

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) => (
  <div className="flex-1 min-w-0 border border-theme-gray-mid rounded-xl bg-white px-5 py-4">
    <div className={`text-2xl font-bold ${accent ?? "text-accent-dim"}`}>
      {value}
    </div>
    <div className="text-xs text-theme-gray mt-1">{label}</div>
  </div>
);

// Every reason to refetch the live analytics collapses into one request per
// window, so a hall starting at once costs one call rather than hundreds
const LIVE_INFO_DELAY = 2000;

// A student whose device IP never arrives would otherwise be chased on every
// event they produce, so the chase gives up until the next student joins
const MAX_LIVE_INFO_CHASES = 8;

const lockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  // Roster-level violation filters
  const [rosterFilter, setRosterFilter] =
    useState<ViolationFilter>(EMPTY_FILTER);
  const [rosterFilterLoading, setRosterFilterLoading] = useState(false);
  // Matching violations per student id; null means no filter is applied and
  // the roster shows every student with its live count.
  const [filteredCounts, setFilteredCounts] = useState<Record<
    string,
    number
  > | null>(null);
  const rosterFilterControllerRef = useRef<AbortController | null>(null);

  // Students holding at least one unpardoned violation — that is what locks
  // the student's UI. The server's violationCount includes pardoned ones, so
  // a student whose violations were all pardoned would otherwise still count.
  const [lockedStudentIds, setLockedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  const refreshLockedStudents = async (signal?: AbortSignal) => {
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/violations/${assessmentId}?${violationQuery({
          isPardoned: "false",
          violationType: "",
        })}`,
        signal ? { signal } : undefined,
      );

      if (res.status === 200 || res.status === 201) {
        const list: Violation[] = res.data.data ?? res.data.violations ?? [];
        setLockedStudentIds(
          new Set(
            list
              .map((violation) => violation.student?._id)
              .filter((id): id is string => Boolean(id)),
          ),
        );
      }
    } catch {
      // Keep the previous tally rather than flashing a wrong number
    }
  };

  // Device IP and lock timestamps, keyed by student id. The ref mirrors the
  // state so socket handlers can read the current value without re-binding.
  const [liveInfo, setLiveInfo] = useState<Record<string, LiveStudent>>({});
  const liveInfoRef = useRef<Record<string, LiveStudent>>({});
  const liveInfoInFlight = useRef(false);
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chaseCountRef = useRef(0);

  // deviceIp is captured at exam start and only reported while a student is
  // live, so entries are merged instead of replaced — a student who submits
  // drops out of liveStudents but their device stays on screen
  const refreshLiveInfo = async (signal?: AbortSignal) => {
    if (liveInfoInFlight.current) return;
    liveInfoInFlight.current = true;

    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/invigilator/analytics/${assessmentId}`,
        signal ? { signal } : undefined,
      );

      if (res.status === 200 || res.status === 201) {
        const live: LiveStudent[] = res.data.data?.liveStudents ?? [];
        const next = { ...liveInfoRef.current };
        let changed = false;
        let gainedIp = false;

        for (const item of live) {
          const current = next[item.studentId];
          if (
            current?.deviceIp === item.deviceIp &&
            current?.lockedAt === item.lockedAt &&
            current?.isLocked === item.isLocked &&
            current?.lockReason === item.lockReason
          ) {
            continue;
          }

          if (!current?.deviceIp && item.deviceIp) gainedIp = true;
          next[item.studentId] = item;
          changed = true;
        }

        // Re-rendering every roster row for an unchanged payload is the main
        // cost of chasing, so state is only committed on a real difference
        if (changed) {
          liveInfoRef.current = next;
          setLiveInfo(next);
        }

        if (gainedIp) chaseCountRef.current = 0;
      }
    } catch {
      // Keep the last known devices rather than blanking the column
    } finally {
      liveInfoInFlight.current = false;
    }
  };

  // force is for lock changes, which must land regardless of how long the
  // device chase has been running
  const scheduleLiveInfoRefresh = (force = false) => {
    if (pendingRefreshRef.current) return;
    if (!force && chaseCountRef.current >= MAX_LIVE_INFO_CHASES) return;
    if (!force) chaseCountRef.current += 1;

    pendingRefreshRef.current = setTimeout(() => {
      pendingRefreshRef.current = null;
      refreshLiveInfo();
    }, LIVE_INFO_DELAY);
  };

  // The backend writes the device IP as the exam starts, so candidate-joined
  // can beat it and the first fetch comes back empty. Every later event for
  // that student re-checks until the IP lands, which is why this is gated on
  // the value still being missing.
  const ensureLiveInfo = (studentId: string) => {
    if (liveInfoRef.current[studentId]?.deviceIp) return;
    scheduleLiveInfoRefresh();
  };

  // Violations modal state
  const [violationsOpen, setViolationsOpen] = useState(false);
  const [violationsStudent, setViolationsStudent] =
    useState<AssignedStudent | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [modalFilter, setModalFilter] = useState<ViolationFilter>(EMPTY_FILTER);
  const [pardoningIds, setPardoningIds] = useState<Set<string>>(new Set());
  const [pardonCodes, setPardonCodes] = useState<Record<string, string>>({});

  // Roster view: students with no matching violation drop out, and the
  // Violations column reports the filtered tally instead of the live one.
  const visibleStudents = filteredCounts
    ? students
        .filter((student) => (filteredCounts[student.id] ?? 0) > 0)
        .map((student) => ({
          ...student,
          violationCount: filteredCounts[student.id],
        }))
    : students;

  const applyRosterFilter = async (filter: ViolationFilter) => {
    setRosterFilter(filter);

    if (!isFilterActive(filter)) {
      rosterFilterControllerRef.current?.abort();
      setFilteredCounts(null);
      setRosterFilterLoading(false);
      return;
    }

    rosterFilterControllerRef.current?.abort();
    const controller = new AbortController();
    rosterFilterControllerRef.current = controller;

    setRosterFilterLoading(true);
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/violations/${assessmentId}?${violationQuery(filter)}`,
        { signal: controller.signal },
      );

      if (res.status === 200 || res.status === 201) {
        const list: Violation[] = res.data.data ?? res.data.violations ?? [];
        const counts: Record<string, number> = {};
        for (const violation of list) {
          const studentId = violation.student?._id;
          if (!studentId) continue;
          counts[studentId] = (counts[studentId] ?? 0) + 1;
        }
        setFilteredCounts(counts);
      }
    } catch (error: any) {
      if (error?.name !== "CanceledError") setFilteredCounts({});
    } finally {
      if (!controller.signal.aborted) setRosterFilterLoading(false);
    }
  };

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
        // A pardon removes one unpardoned violation from this student's count
        if (violationsStudent) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === violationsStudent.id
                ? { ...s, violationCount: Math.max(0, s.violationCount - 1) }
                : s,
            ),
          );
        }
        // The student may still hold other unpardoned violations, so re-derive
        // the locked tally from the server rather than guessing locally
        refreshLockedStudents();
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

  // studentId is always pinned, so every modal request stays scoped to the
  // student whose row was clicked no matter which filters are set.
  const fetchStudentViolations = async (
    studentId: string,
    filter: ViolationFilter,
  ) => {
    setViolationsLoading(true);
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/violations/${assessmentId}?${violationQuery(
          filter,
          studentId,
        )}`,
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

  const applyModalFilter = (filter: ViolationFilter) => {
    setModalFilter(filter);
    if (violationsStudent) fetchStudentViolations(violationsStudent.id, filter);
  };

  // The student being reported; doubles as the malpractice dialog's open state
  const [malpracticeStudent, setMalpracticeStudent] =
    useState<AssignedStudent | null>(null);
  const [malpracticeForm, setMalpracticeForm] = useState({
    description: "",
    action: "",
  });

  const openMalpractice = (student: AssignedStudent) => {
    setMalpracticeStudent(student);
    setMalpracticeForm({ description: "", action: "" });
  };

  const reportMalpractice = async (e: FormEvent) => {
    e.preventDefault();
    if (!malpracticeStudent) return;

    const description = malpracticeForm.description.trim();
    if (!description) {
      toast.error("Describe what happened before submitting.", toastConfig);
      return;
    }

    const action = malpracticeForm.action.trim();
    setLoading("reportMalpractice");

    try {
      const api = await getAxios();
      const res = await api.post(
        `/assessment/physical-malpractice/${assessmentId}/${malpracticeStudent.id}`,
        action ? { description, action } : { description },
      );

      if (res.status === 200 || res.status === 201) {
        // The roster updates off the candidate-alert the server fires back, so
        // the count is not bumped here — that would double-count it
        toast.success(
          `Malpractice recorded against ${malpracticeStudent.fullName}`,
          toastConfig,
        );
        setMalpracticeStudent(null);
      }

      setLoading(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to record the incident, please retry.",
        toastConfig,
      );
      setLoading(null);
    }
  };

  const downloadInvigilationReport = async () => {
    setLoading("invigilationReport");

    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/invigilation-report/${assessmentId}`,
        { responseType: "blob" },
      );

      if (res.status === 200 || res.status === 201) {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${assessment?.course?.code ?? "Assessment"} - Invigilation Report.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setLoading(null);
    } catch (error: any) {
      // A blob response type turns an error body into a Blob too, so there is
      // no server message to surface here
      toast.error(
        "Unable to generate the invigilation report, please retry.",
        toastConfig,
      );
      setLoading(null);
    }
  };

  const openViolations = (student: AssignedStudent) => {
    setViolationsStudent(student);
    setViolations([]);
    setPardonCodes({});
    setPardoningIds(new Set());
    // Each student opens on an unfiltered view
    setModalFilter(EMPTY_FILTER);
    setViolationsOpen(true);
    fetchStudentViolations(student.id, EMPTY_FILTER);
  };

  useEffect(() => {
    if (!session?.user.token) return;
    const controller = new AbortController();
    refreshLockedStudents(controller.signal);
    refreshLiveInfo(controller.signal);
    return () => controller.abort();
  }, [session?.user.token, assessmentId]);

  // Fetch initial assessment data
  useEffect(() => {
    if (!session?.user.token) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/assessment/my-invigilator-assessments", {
          signal: controller.signal,
        });

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
      const { clientApiUrl } = await res.json();
      const socketUrl = new URL(clientApiUrl).origin;

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
          // A new student is worth chasing even if an earlier one gave up
          chaseCountRef.current = 0;
          ensureLiveInfo(studentId);
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
          // A fresh violation is by definition unpardoned, so this student is
          // now locked
          setLockedStudentIds((prev) => new Set(prev).add(data.studentId));
          ensureLiveInfo(data.studentId);
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
          scheduleLiveInfoRefresh(true);
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
          scheduleLiveInfoRefresh(true);
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
          ensureLiveInfo(studentId);
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
          // Last chance to capture the device before the student leaves
          // liveStudents
          ensureLiveInfo(studentId);
        },
      );
    };

    initSocket();

    return () => {
      cancelled = true;
      if (pendingRefreshRef.current) clearTimeout(pendingRefreshRef.current);
      pendingRefreshRef.current = null;
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
    <div className="w-full h-full px-10 py-5 font-sans">
      {assessment && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/invigilator"
                className="flex items-center justify-center w-8 h-8 shrink-0 text-theme-gray hover:text-accent transition-colors"
              >
                <ArrowLeft size={24} />
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
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-52 shrink-0">
                <Button
                  type="button"
                  title="Invigilation Report"
                  loading={loading === "invigilationReport"}
                  variant="outline"
                  icon={<FileSpreadsheet size={16} />}
                  onClick={downloadInvigilationReport}
                />
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
                value={lockedStudentIds.size}
                accent="text-theme-error"
              />
            </div>
          )}

          <Spacer size="xl" />

          {/* Roster violation filters */}
          <div className="flex items-center justify-between">
            <ViolationFilters
              filter={rosterFilter}
              onChange={applyRosterFilter}
              loading={rosterFilterLoading}
            />
            {filteredCounts && (
              <div className="text-sm text-theme-gray">
                {visibleStudents.length} of {students.length} students match
              </div>
            )}
          </div>
          <Spacer size="md" />

          {/* Student Table */}
          <Table
            className={
              filteredCounts && visibleStudents.length === 0
                ? "rounded-b-none border-b-0"
                : ""
            }
            tableHeading={[
              { value: "Full Name", colSpan: "col-span-3" },
              { value: "Reg Number", colSpan: "col-span-2" },
              { value: "Started?", colSpan: "col-span-1" },
              { value: "Con.", colSpan: "col-span-1" },
              { value: "Progress", colSpan: "col-span-1" },
              { value: "Device IP", colSpan: "col-span-2" },
              { value: "Violations", colSpan: "col-span-2" },
            ]}
            tableData={visibleStudents.map((student) => {
              const progress = progressMap[student.id];
              const live = liveInfo[student.id];
              return [
                { value: student.fullName, colSpan: "col-span-3" },
                { value: student.regNumber, colSpan: "col-span-2" },
                {
                  colSpan: "col-span-1",
                  render: () => (
                    <div className="flex flex-col gap-0.5 leading-tight">
                      <span
                        className={`w-fit text-xs rounded-sm py-[1px] px-1.5 ${
                          studentStatusBadgeColor(student.status) === "success"
                            ? "bg-theme-success/5 text-theme-success"
                            : studentStatusBadgeColor(student.status) === "info"
                              ? "bg-theme-info/5 text-theme-info"
                              : studentStatusBadgeColor(student.status) ===
                                  "error"
                                ? "bg-theme-error/5 text-theme-error"
                                : "bg-theme-warning/5 text-theme-warning"
                        }`}
                      >
                        {student.status === "in-progress"
                          ? "yes"
                          : student.status}
                      </span>

                      {live?.lockedAt ? (
                        <span
                          className="text-[10px] text-theme-error"
                          title={`Locked at ${new Date(
                            live.lockedAt,
                          ).toLocaleString()}${
                            live.lockReason ? ` — ${live.lockReason}` : ""
                          }`}
                        >
                          locked {lockTime(live.lockedAt)}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  ),
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
                  colSpan: "col-span-1",
                },
                {
                  value: live?.deviceIp || "—",
                  colSpan: "col-span-2",
                },
                {
                  colSpan: "col-span-2",
                  render: () => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openViolations(student)}
                        // Red flags a locked student, so it tracks unpardoned
                        // violations rather than the pardon-inclusive count
                        className={`flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${
                          lockedStudentIds.has(student.id)
                            ? "text-theme-error hover:opacity-70"
                            : "text-theme-gray hover:text-accent"
                        }`}
                      >
                        <span>({student.violationCount}) View Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openMalpractice(student)}
                        title="Report physical malpractice"
                        className="text-theme-gray hover:text-theme-error cursor-pointer transition-colors"
                      >
                        <Flag size={14} />
                      </button>
                    </div>
                  ),
                },
              ];
            })}
            showSearch={false}
            showOptions={false}
          />

          {filteredCounts && visibleStudents.length === 0 && (
            <div className="border-x border-b rounded-b-xl bg-white py-8 text-center text-sm text-theme-gray">
              No students have violations matching these filters.
            </div>
          )}

          <Spacer size="xl" />
          <Spacer size="xl" />

          {/* Physical Malpractice Modal */}
          <Dialog
            open={!!malpracticeStudent}
            onOpenChange={(open) => !open && setMalpracticeStudent(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Physical Malpractice</DialogTitle>
                <DialogDescription>
                  {malpracticeStudent?.fullName} &mdash;{" "}
                  {malpracticeStudent?.regNumber}. This counts as a violation
                  against the student and alerts every monitor.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <form onSubmit={reportMalpractice}>
                <div className="text-sm text-theme-gray">What happened?</div>
                <Spacer size="sm" />
                <textarea
                  className="w-full outline-none border border-accent-light rounded-md p-3 text-sm min-h-24 max-h-24"
                  placeholder="e.g. Student found with a cheat sheet under the booklet"
                  value={malpracticeForm.description}
                  onChange={(e) =>
                    setMalpracticeForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />

                <Spacer size="sm" />

                <div className="text-sm text-theme-gray">
                  Action taken (optional)
                </div>
                <Spacer size="sm" />
                <Input
                  name="action"
                  type="text"
                  placeholder="e.g. Confiscated material, issued warning"
                  value={malpracticeForm.action}
                  onChange={(e) =>
                    setMalpracticeForm((prev) => ({
                      ...prev,
                      action: e.target.value,
                    }))
                  }
                />

                <Spacer size="md" />

                <Button
                  type="submit"
                  title="Record Incident"
                  loading={loading === "reportMalpractice"}
                  variant="fillError"
                  icon={<Flag size={18} />}
                />
              </form>
            </DialogContent>
          </Dialog>

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

              {/* Same filters as the roster, scoped to this student */}
              <ViolationFilters
                filter={modalFilter}
                onChange={applyModalFilter}
              />

              {violationsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="size-5" />
                </div>
              ) : violations.length === 0 ? (
                <div className="py-8 text-center text-sm text-theme-gray">
                  {isFilterActive(modalFilter)
                    ? "No violations match these filters."
                    : "No violations recorded."}
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
