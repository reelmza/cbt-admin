"use client";

import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { Download } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

type PassRateData = {
  total: number;
  passed: number;
  failed: number;
  autoSubmitted: number;
  passRate: number;
  failRate: number;
  passMark: number;
};

type RankingEntry = {
  student: { _id: string; fullName: string; regNumber: string };
  totalScore: number;
  percentage: number;
  autoSubmitted: boolean;
  rank: number;
};

type RankingData = {
  ranking: RankingEntry[];
  total: number;
  page: number;
  limit: number;
};

const Page = ({ id }: { id: string }) => {
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passRateData, setPassRateData] = useState<PassRateData | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);

  useEffect(() => {
    if (!session || !id) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);

        const [passRateRes, rankingRes] = await Promise.all([
          localAxios.get(`/analytics/pass-rate/${id}`, {
            signal: controller.signal,
          }),
          localAxios.get(`/analytics/ranking/${id}`, {
            signal: controller.signal,
          }),
        ]);

        if (passRateRes.status === 200 && rankingRes.status === 200) {
          setPassRateData(passRateRes.data.data);
          setRankingData(rankingRes.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            `Failed to load analytics$${error?.response?.data?.message || error?.message}`,
          );
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    getData();

    return () => controller.abort();
  }, [session]);

  const downloadPdf = async () => {
    setLoading("downloadPdf");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.get(`/analytics/pass-rate/${id}/pdf`, {
        responseType: "blob",
      });

      if (res.status === 200) {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setLoading(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message,
        toastConfig,
      );
      setLoading(null);
    }
  };

  const passRateCards = passRateData
    ? [
        { label: "Total Students", value: passRateData.total },
        { label: "Passed", value: passRateData.passed },
        { label: "Failed", value: passRateData.failed },
        { label: "Auto Submitted", value: passRateData.autoSubmitted },
        { label: "Pass Rate", value: `${passRateData.passRate || 0}%` },
        { label: "Fail Rate", value: `${passRateData.failRate || 0}%` },
        { label: "Pass Mark", value: `${passRateData.passMark || 0}%` },
      ]
    : [];

  return (
    <div className="w-full h-full p-10 font-sans">
      {passRateData && rankingData && (
        <>
          {/* Pass Rate Section */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Pass Rate</div>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={loading === "downloadPdf"}
              className="flex items-center gap-2 text-sm text-theme-gray hover:text-accent border border-border rounded-md px-3 py-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {loading === "downloadPdf" ? (
                <Spinner className="size-4" />
              ) : (
                <Download size={14} />
              )}
              Download PDF
            </button>
          </div>
          <Spacer size="md" />

          <div className="grid grid-cols-12 gap-4">
            {passRateCards.map((card, key) => (
              <div
                key={key}
                className="col-span-3 p-5 shadow rounded-lg border flex flex-col gap-3"
              >
                <div className="text-theme-gray text-sm">{card.label}</div>
                <div className="text-2xl font-bold">{card.value}</div>
              </div>
            ))}
          </div>

          <Spacer size="xl" />

          {/* Ranking Section */}
          <div className="text-xl font-semibold">Student Rankings</div>
          <Spacer size="md" />

          <Table
            tableHeading={[
              { value: "Rank", colSpan: "col-span-1" },
              { value: "Student Name", colSpan: "col-span-4" },
              { value: "Reg Number", colSpan: "col-span-2" },
              { value: "Score", colSpan: "col-span-2" },
              { value: "Percentage", colSpan: "col-span-2" },
              { value: "Auto Submitted", colSpan: "col-span-1" },
            ]}
            tableData={rankingData.ranking.map((entry) => [
              { value: entry.rank, colSpan: "col-span-1" },
              { value: entry.student.fullName, colSpan: "col-span-4" },
              { value: entry.student.regNumber, colSpan: "col-span-2" },
              { value: entry.totalScore, colSpan: "col-span-2" },
              { value: `${entry.percentage}%`, colSpan: "col-span-2" },
              {
                value: entry.autoSubmitted ? "Yes" : "No",
                colSpan: "col-span-1",
                color: entry.autoSubmitted ? "warning" : undefined,
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
        pageData={!!(passRateData && rankingData)}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export const PageWrapper = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);

  return (
    <SessionProvider>
      <Page id={id} />
    </SessionProvider>
  );
};

export default PageWrapper;
