"use client";

import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { Radio } from "lucide-react";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type AssignedStudent = {
  id: string;
  fullName: string;
  regNumber: string;
  status: string;
  violationCount: number;
};

type InvigilatorAssessment = {
  _id: string;
  title: string;
  session: string;
  term: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  status: string;
  startDate: string;
  dueDate: string;
  authorizedToStart: boolean;
  officialStartTime: string | null;
  totalMarks: number;
  stats: {
    total: number;
    submitted: number;
    inProgress: number;
    stillWriting: number;
    locked: number;
  };
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

const InfoChip = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-theme-gray">{label}</span>
    <span className="text-sm font-medium text-accent-dim">{value}</span>
  </div>
);

const assessmentStatusColor = (status: string) => {
  if (status === "published" || status === "ongoing")
    return "bg-theme-success/10 text-theme-succes";
  if (status === "closed") return "bg-theme-warning/10 text-theme-warning";
  return "bg-theme-gray-light text-theme-gray";
};

const studentStatusBadgeColor = (
  status: string,
): "success" | "info" | "warning" | "error" => {
  if (status === "submitted") return "success";
  if (status === "in-progress") return "info";
  if (status === "locked") return "error";
  return "warning";
};

const Page = () => {
  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] = useState<InvigilatorAssessment[] | null>(
    null,
  );
  const [selected, setSelected] = useState<InvigilatorAssessment | null>(null);
  const { data: session } = useSession();

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
          const list: InvigilatorAssessment[] = Array.isArray(raw)
            ? raw
            : [raw];
          setPageData(list);
          if (list.length > 0) setSelected(list[0]);
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

    !pageData && getData();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="text-2xl font-bold text-accent-dim">
            Invigilator Dashboard
          </div>
          <Spacer size="lg" />

          {/* Assessment Tabs — only rendered when more than one */}
          {pageData.length > 1 && (
            <>
              <div className="relative h-10 w-fit">
                <div className="absolute bottom-0 w-full h-[1px] bg-theme-gray-light" />
                <div className="absolute h-full top-0 left-0 w-fit flex items-center pr-4 z-20">
                  {pageData.map((assessment, key) => (
                    <button
                      key={key}
                      className={`flex items-center justify-center h-full text-sm ml-4 py-2 ${
                        selected?._id === assessment._id
                          ? "border-b-3 text-accent"
                          : "border-none text-theme-gray hover:text-accent"
                      } border-accent cursor-pointer`}
                      onClick={() => setSelected(assessment)}
                    >
                      {assessment.course?.code ?? assessment.title}
                    </button>
                  ))}
                </div>
                <div className="opacity-0 h-full flex items-center pr-4">
                  {pageData.map((assessment, key) => (
                    <div className="ml-4 text-sm" key={key}>
                      {assessment.course?.code ?? assessment.title}
                    </div>
                  ))}
                </div>
              </div>
              <Spacer size="lg" />
            </>
          )}

          {selected && (
            <>
              {/* Assessment Info Card */}
              <div className="border border-theme-gray-mid rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-accent-light/40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold bg-accent text-white rounded px-2 py-1 shrink-0">
                      {selected.course?.code}
                    </span>
                    <span className="text-base font-bold text-accent-dim">
                      {selected.course?.title ?? selected.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold rounded px-2 py-1 capitalize ${assessmentStatusColor(selected.status)}`}
                    >
                      {selected.status}
                    </span>
                    <span
                      className={`text-xs font-semibold rounded px-2 py-1 ${
                        selected.authorizedToStart
                          ? "bg-theme-success/10 text-theme-succes"
                          : "bg-theme-gray-light text-theme-gray"
                      }`}
                    >
                      {selected.authorizedToStart
                        ? "Cleared to Started"
                        : "Not Cleared to Started"}
                    </span>
                    <Link
                      href={`/invigilator/${selected._id}/monitoring`}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white rounded px-2 py-1 hover:bg-accent-dim transition-colors"
                    >
                      <Radio size={12} />
                      Monitoring
                    </Link>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-4 divide-x divide-theme-gray-mid border-t border-theme-gray-mid">
                  <div className="px-5 py-4">
                    <div className="text-xs text-theme-gray mb-1">Session</div>
                    <div className="text-sm font-semibold text-accent-dim">
                      {selected.session}
                    </div>
                    <div className="text-xs text-theme-gray mt-2 mb-1">
                      Term
                    </div>
                    <div className="text-sm font-semibold text-accent-dim">
                      {selected.term}
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs text-theme-gray mb-1">
                      Start Date
                    </div>
                    <div className="text-sm font-semibold text-accent-dim">
                      {prettyDate(selected.startDate.split("T")[0])}
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs text-theme-gray mb-1">Due Date</div>
                    <div className="text-sm font-semibold text-accent-dim">
                      {prettyDate(selected.dueDate.split("T")[0])}
                    </div>
                    {selected.officialStartTime && (
                      <>
                        <div className="text-xs text-theme-gray mt-2 mb-1">
                          Started At
                        </div>
                        <div className="text-sm font-semibold text-accent-dim">
                          {new Date(
                            selected.officialStartTime,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs text-theme-gray mb-1">
                      Total Marks
                    </div>
                    <div className="text-2xl font-bold text-accent-dim">
                      {selected.totalMarks}
                    </div>
                  </div>
                </div>
              </div>

              <Spacer size="lg" />

              {/* Stats Row */}
              <div className="flex gap-4">
                <StatCard label="Total Students" value={selected.stats.total} />
                <StatCard
                  label="Submitted"
                  value={selected.stats.submitted}
                  accent="text-theme-succes"
                />
                <StatCard
                  label="In Progress"
                  value={selected.stats.inProgress}
                  accent="text-theme-info"
                />
                <StatCard
                  label="Still Writing"
                  value={selected.stats.stillWriting}
                  accent="text-theme-info"
                />
                <StatCard
                  label="Locked"
                  value={selected.stats.locked}
                  accent="text-theme-error"
                />
              </div>

              <Spacer size="xl" />

              {/* Student Table */}
              <Table
                tableHeading={[
                  { value: "Full Name", colSpan: "col-span-5" },
                  { value: "Reg Number", colSpan: "col-span-3" },
                  { value: "Status", colSpan: "col-span-2" },
                  { value: "Violations", colSpan: "col-span-2" },
                ]}
                tableData={selected.assignedStudents.map((student) => [
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
            </>
          )}

          <Spacer size="xl" />
          <Spacer size="xl" />
        </>
      )}

      <Preload
        loading={loading}
        pageData={pageData ? true : false}
        errorMessage={errorMessage}
      />
    </div>
  );
};

const PageWrapper = () => (
  <SessionProvider>
    <Page />
  </SessionProvider>
);

export default PageWrapper;
