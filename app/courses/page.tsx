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
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, getAxios } from "@/lib/axios";

import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { toastConfig } from "@/utils/toastConfig";
import { Course, CoursesPageMetaData } from "./courses.types";
import Preload from "@/components/preload";

const Page = () => {
  const [openAddCourse, setOpenAddCourse] = useState(false);
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<Course[] | null>(null);
  const [pageMetaData, setPageMetaData] = useState<CoursesPageMetaData | null>(null);
  const [filterKeyword, setFilterKeyword] = useState("");

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const { data: session } = useSession();

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
      attachHeaders(session!.user.token);
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
    const targetPage = dir === "next" ? pageMetaData.page + 1 : pageMetaData.page - 1;
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

  // Debounced keyword search
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session) return;
    const timeout = setTimeout(() => {
      fetchCourses({ keyword: filterKeyword, page: 1, loadingKey: "search" });
    }, 350);
    return () => clearTimeout(timeout);
  }, [filterKeyword]);

  // Initial load
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        attachHeaders(session!.user.token);
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
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      <>
        {pageData && (
          <>
            {/* Table Options */}
            <div className="flex items-center justify-between">
              {/* Search bar */}
              <TableSearchBox
                placeholder="Search by title, code or description"
                onChange={(e) => setFilterKeyword(e.target.value)}
              />

              {/* Buttons */}
              <div>
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
            </div>
            <Spacer size="md" />

            {/* Navigation */}
            <div className="flex items-center justify-between w-4/10">
              <button
                className="flex items-center justify-center gap-2 h-8 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm"
                onClick={() => getPage("prev")}
              >
                <span>Previous</span>
                {loading === "prevPage" ? <Spinner className="size-4" /> : ""}
              </button>
              <div className="text-sm">
                Page {pageMetaData?.page} of {pageMetaData?.pages}{" "}
                {`(${pageMetaData?.coursesCount})`}
              </div>
              <button
                className="flex items-center justify-center gap-2 h-8 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm"
                onClick={() => getPage("next")}
              >
                <span>Next</span>
                {loading === "nextPage" ? <Spinner className="size-4" /> : ""}
              </button>
            </div>

            {/* Table */}
            <Table
              tableHeading={[
                { value: "Course Code", colSpan: "col-span-2" },
                { value: "Course Title", colSpan: "col-span-3" },
                { value: "Description", colSpan: "col-span-5" },
                { value: "Created", colSpan: "col-span-2" },
              ]}
              tableData={
                pageData
                  ? pageData.map((item) => [
                      { value: item.code, colSpan: "col-span-2" },
                      { value: item.title, colSpan: "col-span-3" },
                      { value: item.description, colSpan: "col-span-5" },
                      {
                        value: item.createdAt.split("T")[0],
                        colSpan: "col-span-2",
                      },
                    ])
                  : []
              }
              showSearch={false}
              showOptions={false}
            />

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
