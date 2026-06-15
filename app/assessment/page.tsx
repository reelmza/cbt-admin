"use client";
import Button from "@/components/button";
import Preload from "@/components/preload";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { Archive, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRole } from "@/lib/useRole";

const Page = () => {
  const [loading, setLoading] = useState<string | null>("page");
  const { data: session } = useSession();
  const { isSuperadmin, isAdmin } = useRole();

  const canViewRow = (item: AssesmentApiResponse) =>
    isSuperadmin || (isAdmin && session?.user?.id === item.createdBy);
  const showActionsColumn = isSuperadmin || isAdmin;
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [filteredPageData, setFilteredPageData] = useState<
    AssesmentApiResponse[] | null
  >(null);
  const [includeArchived, setIncludeArchived] = useState(false);

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
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      setLoading("page");
      setPageData(null);
      setFilteredPageData(null);
      try {
        const api = await getAxios();
        const url = includeArchived
          ? "/admin/assessments?include_archived=true"
          : "/admin/assessments";
        const res = await api.get(url, {
          signal: controller.signal,
        });

        if (res.status === 201) {
          setPageData(res.data.data.assessments);
          setFilteredPageData(res.data.data.assessments);
        }

        setLoading(null);
      } catch (error: any) {
        console.log(error);
        if (!controller.signal.aborted) {
          setLoading("pageError");
        }
      }
    };

    getAssessments();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id, includeArchived]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
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

                    const newData = pageData?.filter(
                      (dt) => dt.endReason !== null
                    );
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
                      (dt) =>
                        dt.authorizedToStart === true && dt.endReason === null
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

            <div className="flex items-center gap-3">
              {isSuperadmin && (
                <div className="w-36">
                  <Button
                    title="Archived"
                    loading={false}
                    variant={includeArchived ? "fill" : "outline"}
                    icon={<Archive size={16} />}
                    type="button"
                    onClick={() => setIncludeArchived((prev) => !prev)}
                  />
                </div>
              )}

              {(isSuperadmin || isAdmin) && (
                <Link href="/assessment/create" className="block w-52">
                  <Button
                    title={"Create an Assessment"}
                    loading={false}
                    variant={"fill"}
                    icon={<Plus size={16} />}
                  />
                </Link>
              )}
            </div>
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
              ...(showActionsColumn
                ? [{ value: "Actions", colSpan: "col-span-1" }]
                : []),
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
                    ...(showActionsColumn
                      ? [
                          canViewRow(item)
                            ? {
                                value: `assessment/${item._id}`,
                                colSpan: "col-span-1",
                                type: "link" as const,
                              }
                            : { value: "", colSpan: "col-span-1" },
                        ]
                      : []),
                  ])
                : []
            }
            showSearch={false}
            showOptions={false}
          />
        </>
      )}

      {/* Page Loading */}
      <Preload loading={loading} pageData={pageData ? true : false} />
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
