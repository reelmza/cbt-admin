"use client";

import Button from "@/components/button";
import Preload from "@/components/preload";
import Table from "@/components/table";
import { getAxios } from "@/lib/axios";
import { AssessmentSubmissionsResponse } from "@/types";
import { toastConfig } from "@/utils/toastConfig";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

const Page = ({ id }: { id: string }) => {
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] =
    useState<AssessmentSubmissionsResponse | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      try {
        const api = await getAxios();
        const res = await api.get(`/assessment/submissions/${id}`, {
          signal: controller.signal,
        });

        if (res.status == 200) {
          console.log(res.data.data);
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
          console.log(error);
        }

        if (error.name === "AxiosError") {
          setErrorMessage(`No Submissions$${error?.response?.data?.message}`);
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id]);

  const handleRemark = async () => {
    try {
      setLoading("handleMark");
      const api = await getAxios();
      await api.post(`/assessment/remark-all/${id}`);
      toast.success("Remark triggered successfully.", toastConfig);
      setLoading(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "Failed to trigger remark.",
        toastConfig,
      );
      setLoading(null);
    }
  };

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">
              List of submissions for {pageData?.assessment.title}
            </div>
            <div className="w-48">
              <Button
                title="Remark Assessment"
                variant="fill"
                loading={loading === "handleMark"}
                onClick={handleRemark}
                type="button"
              />
            </div>
          </div>
          <Table
            tableHeading={[
              { value: "Student Name", colSpan: "col-span-4" },
              { value: "Reg No.", colSpan: "col-span-2" },
              { value: "Level", colSpan: "col-span-1" },
              { value: "Has Automarked", colSpan: "col-span-2" },
              { value: "Score", colSpan: "col-span-1" },
              { value: "Finalized?", colSpan: "col-span-1" },
            ]}
            tableData={
              pageData?.submissions
                ? pageData.submissions.map((item, key: number) => [
                    {
                      value: `${item?.fullName}`,
                      colSpan: "col-span-4",
                    },
                    {
                      value: item?.regNo,
                      colSpan: "col-span-2",
                    },
                    { value: item?.level, colSpan: "col-span-1" },
                    {
                      value: item?.status,
                      colSpan: "col-span-2",
                    },
                    { value: item?.totalScore, colSpan: "col-span-1" },

                    {
                      value: item?.isFullyMarked ? "Yes" : "No",
                      colSpan: "col-span-1",
                      type: "badge",
                      color: `${item?.isFullyMarked ? "success" : "warning"}`,
                    },
                    {
                      value: `assessment/${id}/marking/${item.studentId}`,
                      colSpan: "col-span-1",
                      type: "link",
                    },
                  ])
                : []
            }
            showSearch={false}
            showOptions={false}
          />

          {/* Space */}
          <div className="h-20"></div>
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
