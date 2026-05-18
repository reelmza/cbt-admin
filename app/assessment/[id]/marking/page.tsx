"use client";

import Preload from "@/components/preload";
import Table from "@/components/table";
import { attachHeaders, localAxios } from "@/lib/axios";
import { AssessmentSubmissionsResponse } from "@/types";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] =
    useState<AssessmentSubmissionsResponse | null>(null);

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(`/assessment/submissions/${id}`, {
          signal: controller.signal,
        });

        if (res.status == 200) {
          console.log(res.data.data);
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
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
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="text-2xl">
            List of submissions for {pageData?.assessment.title}
          </div>
          <Table
            tableHeading={[
              { value: "Student Name", colSpan: "col-span-4" },
              { value: "Reg No.", colSpan: "col-span-2" },
              { value: "Level", colSpan: "col-span-1" },
              { value: "Status", colSpan: "col-span-2" },
              { value: "Score", colSpan: "col-span-1" },
              { value: "Marked?", colSpan: "col-span-1" },
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
