"use client";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";

type ArchiveResponse = {
  _id: string;
  student: { _id: string; fullName: string; regNumber: string };
  attemptNumber: number;
  answers: unknown[];
  totalScore: number;
  percentage: number;
  status: string;
  isSubmitted: boolean;
  createdAt: string;
};

type ArchiveDetail = {
  _id: string;
  assessmentTitle: string;
  responseCount: number;
  data: { responses: ArchiveResponse[] };
};

const responseStatusColor = (
  status: string,
): "success" | "info" | "warning" | "error" => {
  if (status === "completed") return "success";
  if (status === "in-progress") return "info";
  return "warning";
};

const Page = ({ id }: { id: string }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] = useState<ArchiveDetail | null>(null);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getArchive = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(`/admin/archive/${id}`, {
          signal: controller.signal,
        });

        if (res.status === 200 || res.status === 201) {
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          const status = error?.response?.status;
          if (status === 404) {
            setErrorMessage(
              "Not Found$This archive record does not exist or may have been removed.",
            );
          } else if (status === 403) {
            setErrorMessage(
              "Access Denied$You don't have permission to view this archive.",
            );
          } else {
            setErrorMessage(
              "Something went wrong$The archive could not be loaded. Please try again.",
            );
          }
          setLoading("pageError");
        }
      }
    };

    !pageData && getArchive();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link
              href="/assessment/archives"
              className="flex items-center justify-center w-8 h-8 rounded-md border border-theme-gray-mid hover:bg-theme-gray-light transition-colors"
            >
              <ArrowLeft size={16} className="text-theme-gray" />
            </Link>
            <div>
              <div className="text-2xl font-semibold">
                {pageData.assessmentTitle}
              </div>
              <div className="text-sm text-theme-gray">
                {pageData.responseCount} response
                {pageData.responseCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <Spacer size="xl" />

          <Table
            tableHeading={[
              { value: "Full Name", colSpan: "col-span-3" },
              { value: "Reg Number", colSpan: "col-span-2" },
              { value: "Ans.", colSpan: "col-span-1" },
              { value: "Score", colSpan: "col-span-1" },
              { value: "%", colSpan: "col-span-1" },
              { value: "Attempt", colSpan: "col-span-1" },
              { value: "Date", colSpan: "col-span-2" },
              { value: "Status", colSpan: "col-span-1" },
            ]}
            tableData={pageData.data.responses.map((response) => [
              {
                value: response.student?.fullName ?? "—",
                colSpan: "col-span-3",
              },
              {
                value: response.student?.regNumber ?? "—",
                colSpan: "col-span-2",
              },
              { value: response.answers.length, colSpan: "col-span-1" },
              { value: response.totalScore, colSpan: "col-span-1" },
              { value: `${response.percentage}%`, colSpan: "col-span-1" },
              { value: response.attemptNumber, colSpan: "col-span-1" },
              {
                value: prettyDate(response.createdAt.split("T")[0]),
                colSpan: "col-span-2",
              },
              {
                value: response.status,
                colSpan: "col-span-1",
                type: "badge" as const,
                color: responseStatusColor(response.status),
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
        pageData={pageData ? true : false}
        errorMessage={errorMessage}
      />
    </div>
  );
};

const PageWrapper = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  return (
    <SessionProvider>
      <Page id={id} />
    </SessionProvider>
  );
};

export default PageWrapper;
