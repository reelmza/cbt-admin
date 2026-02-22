"use client";
import Button from "@/components/button";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { assessmentTableData } from "@/utils/dummy-data";
import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

const Page = () => {
  const controller = new AbortController();
  const [loading, setLoading] = useState<string | null>("page");
  const { data: session } = useSession();
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [filteredPageData, setFilteredPageData] = useState<
    AssesmentApiResponse[] | null
  >(null);

  const searchAss = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const val = e.target.value.toUpperCase();

    if (val === "") {
      setFilteredPageData(pageData);
      return;
    }

    const newData = pageData?.filter((dt) => dt.title.includes(val));

    setFilteredPageData((prev) => {
      if (newData) {
        return newData;
      }

      return prev;
    });
  };

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/admin/assessments", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res.data.data.assessments);
          setPageData(res.data.data.assessments);
          setFilteredPageData(res.data.data.assessments);
        }

        setLoading(null);
      } catch (error: any) {
        console.log(error);
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
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
      {/* Page Navigator */}
      <PageNavigator
        navList={[
          {
            name: "All Assessment",
            fx: () => {
              if (!pageData) return;
              setFilteredPageData(pageData);
            },
          },
          {
            name: "Not Started",
            fx: () => {
              setFilteredPageData((prev) => {
                if (!pageData) return prev;

                const newData = pageData?.filter(
                  (dt) => dt.authorizedToStart == false
                );
                if (newData) {
                  return newData;
                }

                return prev;
              });
            },
          },
          {
            name: "Completed",
            fx: () => {
              setFilteredPageData((prev) => {
                if (!pageData) return prev;

                const newData = pageData?.filter((dt) => dt.endReason !== null);
                if (newData) {
                  return newData;
                }

                return prev;
              });
            },
          },
          {
            name: "Ongoing",
            fx: () => {
              setFilteredPageData((prev) => {
                if (!pageData) return prev;
                const newData = pageData?.filter(
                  (dt) => dt.authorizedToStart === true && dt.endReason === null
                );
                if (newData) {
                  return newData;
                }

                return prev;
              });
            },
          },
        ]}
      />
      <Spacer size="lg" />

      {/* Table Headers */}
      <div className="flex items-center justify-between">
        <TableSearchBox
          placeholder="Search an assessment"
          onChange={searchAss}
        />

        <Link href="/assessment/create" className="block w-52">
          <Button
            title={"Create an Assessment"}
            loading={false}
            variant={"fill"}
            icon={<Plus size={16} />}
          />
        </Link>
      </div>

      <Table
        tableHeading={[
          { value: "Course", colSpan: "col-span-3" },
          { value: "Due Date", colSpan: "col-span-3" },
          { value: "Sections", colSpan: "col-span-1" },
          { value: "Qst", colSpan: "col-span-1" },
          { value: "Students", colSpan: "col-span-1" },
          { value: "Marks", colSpan: "col-span-1" },
          { value: "Status", colSpan: "col-span-1" },
          { value: "Actions", colSpan: "col-span-1" },
        ]}
        tableData={
          filteredPageData
            ? filteredPageData.map((item, key: number) => [
                {
                  value: `${item.title}`,
                  colSpan: "col-span-3",
                },
                {
                  value: prettyDate(item.dueDate.split("T")[0]),
                  colSpan: "col-span-3",
                },
                { value: item.sections.length, colSpan: "col-span-1" },
                {
                  value: item.sections.reduce(
                    (acc: number, sct: { questions: [] }) => {
                      if (sct.questions?.length) {
                        return sct.questions?.length + acc;
                      }
                      return 0;
                    },
                    0
                  ),
                  colSpan: "col-span-1",
                },
                { value: item?.students?.length, colSpan: "col-span-1" },
                { value: item.totalMarks || "-", colSpan: "col-span-1" },
                {
                  value: item.status,
                  colSpan: "col-span-1",
                  type: "badge",
                  color: `${
                    item.status === "closed"
                      ? "warning"
                      : item.status === "ongoing"
                      ? "info"
                      : "success"
                  }`,
                },
                {
                  value: `assessment/${item._id}`,
                  colSpan: "col-span-1",
                  type: "link",
                },
              ])
            : []
        }
        showSearch={false}
        showOptions={false}
      />

      {/* Page Loading */}
      {loading === "page" ? (
        <div className="flex items-center gap-2 mt-2 text-theme-gray">
          <Spinner />
          <div className="text-sm">Fetching data</div>
        </div>
      ) : (
        ""
      )}

      <Spacer size="xl" />
    </div>
  );
};

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default PageWrapper;
