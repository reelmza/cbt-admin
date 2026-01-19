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
import { attachHeaders, localAxios } from "@/lib/axios";

import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const controller = new AbortController();
  const [openAddCourse, setOpenAddCourse] = useState(false);
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<
    | null
    | {
        _id: number;
        code: string;
        title: string;
        description: string;
      }[]
  >(null);
  const { data: session } = useSession();

  const addCourse = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      courseCode: { value: string };
      courseTitle: { value: string };
      courseDescription: { value: string };
    };

    setLoading("addCourse");
    try {
      const res = await localAxios.post("/admin/create-course", {
        code: target.courseCode.value,
        title: target.courseTitle.value,
        description: target.courseDescription.value,
        school: session?.user.id,
      });

      if (res.status === 201) {
        setLoading(null);
        setOpenAddCourse(false);
        toast.success("Course has been added successfully.");
        setPageData((prev) => {
          if (!prev) {
            return [res.data.data];
          }

          return [...prev, res.data.data];
        });
      }
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session) return;

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/admin/courses", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res.data.data.courses);
          setPageData(res.data.data.courses);
        }
        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
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
      {/* Table Options */}
      <div className="flex items-center justify-between">
        {/* Search bar */}
        <TableSearchBox placeholder="Search for a course" />

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

      {/* Table */}
      <Table
        tableHeading={[
          { value: "Course Code", colSpan: "col-span-2" },
          { value: "Course Title", colSpan: "col-span-3" },
          { value: "Description", colSpan: "col-span-6" },

          { value: "", colSpan: "col-span-1" },
        ]}
        tableData={
          pageData
            ? pageData.map((item, key) => [
                { value: item.code, colSpan: "col-span-2" },
                { value: item.title, colSpan: "col-span-3" },
                { value: item.description, colSpan: "col-span-6" },
                { value: item._id, colSpan: "col-span-1", type: "link" },
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
