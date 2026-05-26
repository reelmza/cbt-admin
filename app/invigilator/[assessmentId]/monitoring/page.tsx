"use client";

import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import { attachHeaders, localAxios } from "@/lib/axios";
import { ArrowLeft, Radio } from "lucide-react";
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

  // Fetch initial assessment data
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(
          "/assessment/my-invigilator-assessments",
          { signal: controller.signal },
        );

        if (res.status === 200 || res.status === 201) {
          const raw = res.data.data;
          const list: MonitoringAssessment[] = Array.isArray(raw)
            ? raw
            : [raw];
          const match = list.find((a) => a._id === assessmentId);

          if (match) {
            setAssessment(match);
            setStudents(match.assignedStudents);
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
  }, [session]);

  // Initialize socket once after session is available
  useEffect(() => {
    if (!session || socketRef.current) return;

    let cancelled = false;

    const initSocket = async () => {
      const res = await fetch(`${window.location.origin}/api/config`);
      const { baseUrl } = await res.json();
      const socketUrl = new URL(baseUrl).origin;

      // Cleanup ran before the async fetch resolved — abort
      if (cancelled) return;

      const socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("monitor-assessment", assessmentId);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });
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
  }, [session]);

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
                label="In Progress"
                value={stats.inProgress}
                accent="text-theme-info"
              />
              <StatCard
                label="Still Writing"
                value={stats.stillWriting}
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
              { value: "Full Name", colSpan: "col-span-5" },
              { value: "Reg Number", colSpan: "col-span-3" },
              { value: "Status", colSpan: "col-span-2" },
              { value: "Violations", colSpan: "col-span-2" },
            ]}
            tableData={students.map((student) => [
              { value: student.fullName, colSpan: "col-span-5" },
              { value: student.regNumber, colSpan: "col-span-3" },
              {
                value: student.status,
                colSpan: "col-span-2",
                type: "badge" as const,
                color: studentStatusBadgeColor(student.status),
              },
              {
                value: student.violationCount,
                colSpan: "col-span-2",
                ...(student.violationCount > 0
                  ? { color: "error" as const }
                  : {}),
              },
            ])}
            showSearch={false}
            showOptions={false}
          />

          <Spacer size="xl" />
          <Spacer size="xl" />
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
