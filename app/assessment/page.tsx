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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive, Layers, PencilLine, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRole } from "@/lib/useRole";
import CreateFromBank from "./create-from-bank";

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
  const router = useRouter();
  const { isSuperadmin, isAdmin, isLecturer, isExamOfficer } = useRole();

  // Which step of the create flow is on screen: the path picker, the question
  // bank form, or neither
  const [createFlow, setCreateFlow] = useState<"choose" | "bank" | null>(null);

  const owns = (item: AssesmentApiResponse) =>
    !!session?.user?.id && session.user.id === item.createdBy;

  const canViewRow = (item: AssesmentApiResponse) =>
    isSuperadmin || ((isAdmin || isLecturer || isExamOfficer) && owns(item));
  const showActionsColumn =
    isSuperadmin || isAdmin || isLecturer || isExamOfficer;

  // A lecturer may only ever see what they authored, whatever the list endpoint
  // hands back
  const scopeToRole = (items: AssesmentApiResponse[]) =>
    isLecturer ? items.filter(owns) : items;
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
    Object.entries(next).forEach(
      ([key, value]) => value && query.set(key, value),
    );

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/assessments?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 201) {
        const assessments = scopeToRole(res.data.data.assessments);
        setPageData(assessments);
        setFilteredPageData(assessments);
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
          const assessments: AssesmentApiResponse[] = scopeToRole(
            assessmentsRes.data.data.assessments,
          );
          setPageData(assessments);
          setFilteredPageData(assessments);

          // Built from the unfiltered load so narrowing a filter never removes
          // the option needed to widen it again
          setSessionOptions([
            ...new Set(
              assessments
                .map((item) => item.session)
                .filter(Boolean) as string[],
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
    <div className="w-full h-full px-10 py-5 font-sans">
      {pageData && (
        <>
          <h1 className="text-xl font-serif font-bold text-accent-dim">
            Assessments
          </h1>
          <Spacer size="sm" />

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
                    title="Archives"
                    loading={false}
                    variant={includeArchived ? "fill" : "outline"}
                    type="button"
                    onClick={() => setIncludeArchived((prev) => !prev)}
                  />
                </div>
              )}

              {(isSuperadmin || isAdmin || isLecturer || isExamOfficer) && (
                <div className="w-52">
                  <Button
                    title={"Create Assessment"}
                    loading={false}
                    variant={"fill"}
                    type="button"
                    icon={<Plus size={18} strokeWidth="2.5" />}
                    onClick={() =>
                      isLecturer
                        ? router.push("/assessment/create")
                        : setCreateFlow("choose")
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <Spacer size="md" />

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
              <SelectTrigger className="w-44 text-sm text-theme-gray bg-white rounded-xl">
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
              <SelectTrigger className="w-44 text-sm text-theme-gray bg-white rounded-xl">
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
              <SelectTrigger className="w-60 text-sm text-theme-gray bg-white rounded-xl">
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
                className="text-sm text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
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
          <Spacer size="md" />

          <Table
            className={
              filteredPageData?.length === 0 ? "rounded-b-none border-b-0" : ""
            }
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
                        0,
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
            <div className="border-x border-b rounded-b-xl bg-white h-20 flex items-center justify-center text-sm text-theme-gray">
              No assessments match these filters.
            </div>
          ) : (
            ""
          )}

          {/* Pick how the assessment gets its questions */}
          <Dialog
            open={createFlow === "choose"}
            onOpenChange={(open) => !open && setCreateFlow(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create an Assessment</DialogTitle>
                <DialogDescription>
                  Choose where this assessment's questions will come from.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/assessment/create")}
                  className="flex items-start gap-3 border border-theme-gray-mid rounded-xl p-4 text-left hover:border-theme-gray-dim transition-colors cursor-pointer"
                >
                  <PencilLine size={20} className="text-foreground shrink-0 mt-1" />
                  <span>
                    <span className="block font-medium">
                      Create Assessment Manually
                    </span>
                    <span className="block text-sm text-theme-gray mt-1">
                      Set up sections and write each question yourself.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateFlow("bank")}
                  className="flex items-start gap-3 border border-theme-gray-mid rounded-xl p-4 text-left hover:border-theme-gray-dim transition-colors cursor-pointer"
                >
                  <Layers size={20} className="text-foreground shrink-0 mt-1" />
                  <span>
                    <span className="block font-medium">
                      Create Assessment from Question Bank
                    </span>
                    <span className="block text-sm text-theme-gray mt-1">
                      Pull a bank's questions in and skip the question builder.
                    </span>
                  </span>
                </button>
              </div>
              <Spacer size="sm" />
            </DialogContent>
          </Dialog>

          <CreateFromBank
            open={!isLecturer && createFlow === "bank"}
            onOpenChange={(open) => !open && setCreateFlow(null)}
            courses={courses}
            onCreated={() => fetchAssessments(filters, includeArchived)}
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
