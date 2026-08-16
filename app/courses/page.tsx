"use client";

import Button from "@/components/button";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Input from "@/components/input";
import { Input as FileInput } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";

import { CloudUpload, Download, Pencil, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { toastConfig } from "@/utils/toastConfig";
import { Course, CoursesPageMetaData } from "./courses.types";
import Preload from "@/components/preload";
import { useRole } from "@/lib/useRole";
import {
  BulkImportResult,
  downloadImportTemplate,
  runBulkImport,
} from "@/lib/bulkImport";
import BulkImportSummary from "@/components/bulk-import-result";

const Page = () => {
  const [openAddCourse, setOpenAddCourse] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  // Kept after the import so the skipped and failed rows stay readable
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  // Holds the course being edited; doubles as the edit dialog's open state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<Course[] | null>(null);
  const [pageMetaData, setPageMetaData] = useState<CoursesPageMetaData | null>(
    null,
  );
  const [filterKeyword, setFilterKeyword] = useState("");

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const { data: session } = useSession();
  const { isSuperadmin } = useRole();

  const fetchCourses = async ({
    keyword,
    page,
    loadingKey = "fetchCourses",
  }: {
    keyword: string;
    page: number;
    loadingKey?: string;
  }) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(loadingKey);

    const query = new URLSearchParams({ pageNumber: String(page) });
    if (keyword) query.set("searchByKeyword", keyword);

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/courses?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 200 || res.status === 201) {
        setPageData(res.data.data.courses);
        setPageMetaData({
          page: res.data.data.page,
          pages: res.data.data.pages,
          coursesCount: res.data.data.coursesCount,
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
      }
    }
  };

  const getPage = (dir: string) => {
    if (!pageMetaData?.page) return;
    const targetPage =
      dir === "next" ? pageMetaData.page + 1 : pageMetaData.page - 1;
    fetchCourses({
      keyword: filterKeyword,
      page: targetPage,
      loadingKey: dir === "next" ? "nextPage" : "prevPage",
    });
  };

  const addCourse = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      courseCode: { value: string };
      courseTitle: { value: string };
      courseDescription: { value: string };
    };

    setLoading("addCourse");
    try {
      const api = await getAxios();
      const res = await api.post("/admin/create-course", {
        code: target.courseCode.value,
        title: target.courseTitle.value,
        description: target.courseDescription.value,
      });

      if (res.status === 201) {
        setLoading(null);
        setOpenAddCourse(false);
        toast.success("Course has been added successfully.", toastConfig);
        fetchCourses({ keyword: filterKeyword, page: 1 });
      }
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  const updateCourse = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const target = e.target as typeof e.target & {
      courseCode: { value: string };
      courseTitle: { value: string };
      courseDescription: { value: string };
    };

    setLoading("updateCourse");
    try {
      const api = await getAxios();
      const res = await api.patch(`/admin/course/${editingCourse._id}`, {
        code: target.courseCode.value,
        title: target.courseTitle.value,
        description: target.courseDescription.value,
      });

      if (res.status === 200 || res.status === 201) {
        setLoading(null);
        setEditingCourse(null);
        toast.success("Course has been updated successfully.", toastConfig);
        // Stay on the page being viewed rather than jumping back to the first
        fetchCourses({
          keyword: filterKeyword,
          page: pageMetaData?.page ?? 1,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to update the course, please retry.", toastConfig);
      setLoading(null);
    }
  };

  const getTemplate = async () => {
    setLoading("courseTemplate");
    await downloadImportTemplate("courses");
    setLoading(null);
  };

  const bulkUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      bulkUpload: { files: FileList };
    };
    const file = target.bulkUpload.files[0];
    if (!file) return;

    setLoading("bulkUpload");
    const result = await runBulkImport("courses", file);
    setLoading(null);
    if (!result) return;

    setBulkResult(result);
    toast.success(
      `${result.created.length} course${result.created.length === 1 ? "" : "s"} imported`,
      toastConfig,
    );

    // Even a partial import changes the list, so it is always refetched
    fetchCourses({ keyword: filterKeyword, page: pageMetaData?.page ?? 1 });
  };

  // Debounced keyword search
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session?.user?.id) return;
    const timeout = setTimeout(() => {
      fetchCourses({ keyword: filterKeyword, page: 1, loadingKey: "search" });
    }, 350);
    return () => clearTimeout(timeout);
  }, [filterKeyword]);

  // Initial load
  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/admin/courses?pageNumber=1", {
          signal: controller.signal,
        });

        if (res.status === 200 || res.status === 201) {
          setPageData(res.data.data.courses);
          setPageMetaData({
            page: res.data.data.page,
            pages: res.data.data.pages,
            coursesCount: res.data.data.coursesCount,
          });
        }
        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getData();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id]);

  return (
    <div className="w-full h-full px-10 py-5 font-sans">
      <>
        {pageData && (
          <>
            <h1 className="text-xl font-serif font-bold text-accent-dim">
              Courses
            </h1>
            <Spacer size="sm" />

            {/* Table Options */}
            <div className="flex items-center justify-between">
              {/* Search bar */}
              <TableSearchBox
                placeholder="Search by title, code or description"
                onChange={(e) => setFilterKeyword(e.target.value)}
              />

              {/* Buttons */}
              {isSuperadmin && (
                <div className="flex items-center gap-3">
                  <div className="w-52">
                    <Button
                      title="Bulk Upload"
                      icon={<CloudUpload size={16} strokeWidth={2.5} />}
                      variant="outline"
                      loading={false}
                      onClick={() => {
                        setBulkResult(null);
                        setOpenBulkUpload(true);
                      }}
                      type="button"
                    />
                  </div>

                  <div className="w-52">
                    <Button
                      title="Add a course"
                      icon={<Plus size={16} strokeWidth={2.5} />}
                      variant="fill"
                      loading={false}
                      onClick={() => setOpenAddCourse((prev) => !prev)}
                    />
                  </div>
                </div>
              )}
            </div>
            <Spacer size="md" />

            {/* Navigation */}
            <div className="flex items-center justify-between w-4/10">
              <button
                className="flex items-center justify-center gap-2 h-8 w-28 rounded-xl border text-theme-gray bg-white cursor-pointer text-sm"
                onClick={() => getPage("prev")}
              >
                <span>Previous</span>
                {loading === "prevPage" ? <Spinner className="size-4" /> : ""}
              </button>
              <div className="text-sm text-theme-gray">
                Page {pageMetaData?.page} of {pageMetaData?.pages}{" "}
                {`(${pageMetaData?.coursesCount})`}
              </div>
              <button
                className="flex items-center justify-center gap-2 h-8 w-28 rounded-xl border text-theme-gray bg-white cursor-pointer text-sm"
                onClick={() => getPage("next")}
              >
                <span>Next</span>
                {loading === "nextPage" ? <Spinner className="size-4" /> : ""}
              </button>
            </div>
            <Spacer size="md" />

            {/* Table */}
            <Table
              className={
                pageData?.length === 0 ? "rounded-b-none border-b-0" : ""
              }
              tableHeading={[
                { value: "Course Code", colSpan: "col-span-2" },
                { value: "Course Title", colSpan: "col-span-3" },
                {
                  value: "Description",
                  colSpan: isSuperadmin ? "col-span-4" : "col-span-5",
                },
                { value: "Created", colSpan: "col-span-2" },
                ...(isSuperadmin ? [{ value: "", colSpan: "col-span-1" }] : []),
              ]}
              tableData={
                pageData
                  ? pageData.map((item) => [
                      { value: item.code, colSpan: "col-span-2" },
                      { value: item.title, colSpan: "col-span-3" },
                      {
                        value: item.description,
                        colSpan: isSuperadmin ? "col-span-4" : "col-span-5",
                      },
                      {
                        value: item.createdAt.split("T")[0],
                        colSpan: "col-span-2",
                      },
                      ...(isSuperadmin
                        ? [
                            {
                              colSpan: "col-span-1",
                              render: () => (
                                <button
                                  type="button"
                                  onClick={() => setEditingCourse(item)}
                                  title="Edit course"
                                  className="flex items-center gap-1 text-theme-gray hover:text-accent cursor-pointer"
                                >
                                  <Pencil size={14} />
                                  <span>Edit</span>
                                </button>
                              ),
                            },
                          ]
                        : []),
                    ])
                  : []
              }
              showSearch={false}
              showOptions={false}
            />

            {pageData?.length === 0 ? (
              <div className="border-x border-b rounded-b-xl bg-white h-20 flex items-center justify-center text-sm text-theme-gray">
                {filterKeyword
                  ? "No courses match this search."
                  : "No courses yet."}
              </div>
            ) : (
              ""
            )}

            {/* Bulk Upload Courses */}
            <Dialog open={openBulkUpload} onOpenChange={setOpenBulkUpload}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Courses</DialogTitle>
                  <DialogDescription className="pr-28">
                    Upload an Excel file (.xlsx) of courses. Codes that already
                    exist are skipped.
                  </DialogDescription>
                </DialogHeader>

                <form className="pr-28" onSubmit={bulkUpload}>
                  <FileInput
                    id="bulkUpload"
                    name="bulkUpload"
                    type="file"
                    accept=".xlsx"
                    className="cursor-pointer"
                    required
                  />
                  <Spacer size="md" />

                  <Button
                    title={"Upload File"}
                    loading={loading === "bulkUpload"}
                    variant={"fill"}
                    icon={<CloudUpload size={20} />}
                  />

                  <Spacer size="md" />
                  <div className="text-sm text-theme-gray">
                    Columns: Course Title, Course Code, Description. <br />
                    <br />
                    <button
                      type="button"
                      onClick={getTemplate}
                      disabled={loading === "courseTemplate"}
                      className="inline-flex items-center gap-1 text-accent underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading === "courseTemplate" ? (
                        <Spinner className="size-3" />
                      ) : (
                        <Download size={12} />
                      )}
                      Download Upload Template
                    </button>
                  </div>

                  {bulkResult && (
                    <>
                      <Spacer size="md" />
                      <BulkImportSummary result={bulkResult} />
                    </>
                  )}
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openAddCourse} onOpenChange={setOpenAddCourse}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a course</DialogTitle>
                  <DialogDescription className="pr-28">
                    Add a new taken subject in the school.
                  </DialogDescription>
                </DialogHeader>

                <form className="pr-28" onSubmit={addCourse}>
                  {/* Course Code */}
                  <Input
                    name="courseCode"
                    type="text"
                    placeholder={"Enter course code"}
                    required
                  />
                  <Spacer size="sm" />

                  {/* Course title */}
                  <Input
                    name="courseTitle"
                    type="text"
                    placeholder={"Enter course title"}
                    required
                  />
                  <Spacer size="sm" />

                  {/* Course Description */}
                  <Input
                    name="courseDescription"
                    type="text"
                    placeholder={"Enter bief description"}
                    required
                  />
                  <Spacer size="sm" />

                  <Button
                    title={"Add course"}
                    loading={loading === "addCourse"}
                    variant={"fill"}
                    icon={<Plus size={20} />}
                  />

                  <Spacer size="md" />
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Course */}
            <Dialog
              open={!!editingCourse}
              onOpenChange={(open) => !open && setEditingCourse(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit course</DialogTitle>
                  <DialogDescription className="pr-28">
                    Update the code, title or description of this course.
                  </DialogDescription>
                </DialogHeader>

                {editingCourse && (
                  // Keyed so the inputs reseed when a different course is picked
                  <form
                    key={editingCourse._id}
                    className="pr-28"
                    onSubmit={updateCourse}
                  >
                    {/* Course Code */}
                    <Input
                      name="courseCode"
                      type="text"
                      placeholder={"Enter course code"}
                      defaultValue={editingCourse.code}
                      required
                    />
                    <Spacer size="sm" />

                    {/* Course title */}
                    <Input
                      name="courseTitle"
                      type="text"
                      placeholder={"Enter course title"}
                      defaultValue={editingCourse.title}
                      required
                    />
                    <Spacer size="sm" />

                    {/* Course Description */}
                    <Input
                      name="courseDescription"
                      type="text"
                      placeholder={"Enter bief description"}
                      defaultValue={editingCourse.description}
                      required
                    />
                    <Spacer size="sm" />

                    <Button
                      title={"Save changes"}
                      loading={loading === "updateCourse"}
                      variant={"fill"}
                      icon={<Pencil size={20} />}
                    />

                    <Spacer size="md" />
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </>

      <Preload loading={loading} pageData={pageData ? true : false} />
    </div>
  );
};

const Courses = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default Courses;
