"use client";
import Button from "@/components/button";
import Preload from "@/components/preload";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { Archive, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRole } from "@/lib/useRole";

type AssessmentFilter = {
  status: string;
  session: string;
  course: string;
  search: string;
};

const EMPTY_ASSESSMENT_FILTER: AssessmentFilter = {
  status: "",
  session: "",
  course: "",
  search: "",
};

const ASSESSMENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "ongoing", label: "Ongoing" },
  { value: "ended", label: "Ended" },
  { value: "closed", label: "Closed" },
];

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
  const [filters, setFilters] = useState<AssessmentFilter>(
    EMPTY_ASSESSMENT_FILTER,
  );
  const [courses, setCourses] = useState<
    { _id: string; code: string; title: string }[] | null
  >(null);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const fetchAssessments = async (
    next: AssessmentFilter,
    archived: boolean,
  ) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading("filterAssessments");

    const query = new URLSearchParams();
    if (archived) query.set("include_archived", "true");
    Object.entries(next).forEach(([key, value]) => value && query.set(key, value));

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/assessments?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 201) {
        setPageData(res.data.data.assessments);
        setFilteredPageData(res.data.data.assessments);
      }

      setLoading(null);
    } catch (error: any) {
      // A failed filter keeps the current rows on screen rather than
      // dropping the whole page into its error state
      if (error.name === "CanceledError") return;
      toast.error("Unable to filter assessments, please retry.", toastConfig);
      setLoading(null);
    }
  };

  // Initial load
  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getData = async () => {
      setLoading("page");
      try {
        const api = await getAxios();
        const [assessmentsRes, coursesRes] = await Promise.all([
          api.get("/admin/assessments", { signal: controller.signal }),
          api.get("/admin/courses", { signal: controller.signal }),
        ]);

        if (assessmentsRes.status === 201) {
          const assessments: AssesmentApiResponse[] =
            assessmentsRes.data.data.assessments;
          setPageData(assessments);
          setFilteredPageData(assessments);

          // Built from the unfiltered load so narrowing a filter never removes
          // the option needed to widen it again
          setSessionOptions([
            ...new Set(
              assessments.map((item) => item.session).filter(Boolean) as string[],
            ),
          ]);
        }

        if (coursesRes.status === 201) {
          setCourses(coursesRes.data.data.courses);
        }

        setLoading(null);
      } catch (error: any) {
        console.log(error);
        if (!controller.signal.aborted) {
          setLoading("pageError");
        }
      }
    };

    getData();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id]);

  // Debounced server-side filtering
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session?.user?.id) return;

    const timeout = setTimeout(() => {
      fetchAssessments(filters, includeArchived);
    }, 350);

    return () => clearTimeout(timeout);
  }, [filters, includeArchived]);

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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
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
          <Spacer size="sm" />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ASSESSMENT_STATUSES.map((item) => (
                  <SelectItem value={item.value} key={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.session || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  session: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sessions</SelectItem>
                {sessionOptions.map((item) => (
                  <SelectItem value={item} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.course || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  course: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses
                  ? courses.map((item) => (
                      <SelectItem value={item._id} key={item._id}>
                        {item.code} — {item.title}
                      </SelectItem>
                    ))
                  : ""}
              </SelectContent>
            </Select>

            {loading === "filterAssessments" ? (
              <Spinner className="size-4 text-theme-gray" />
            ) : (
              ""
            )}

            {filters.status || filters.session || filters.course ? (
              <button
                type="button"
                className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({
                    ...EMPTY_ASSESSMENT_FILTER,
                    search: prev.search,
                  }))
                }
              >
                Clear filters
              </button>
            ) : (
              ""
            )}
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

          {filteredPageData?.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-sm text-theme-gray">
              No assessments match these filters.
            </div>
          ) : (
            ""
          )}
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
