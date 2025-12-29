"use client";

import Button from "@/components/button";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { studentsData } from "@/utils/dummy-data";
import { CloudUpload } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const Page = () => {
  const controller = new AbortController();
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<
    | null
    | {
        _id: number;
        fullName: string;
        email: string;
        phoneNumber: string;
        password: string;
        regNumber: string;
        gender: string;
        assessments: [];
        school: string;
      }[]
  >(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/school/students", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res.data.data.data.students);
          setPageData(res.data.data.data.students);
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
      <PageNavigator
        navList={[
          { name: "Students", route: "/users" },
          { name: "Staff", route: "/users/staff" },
        ]}
      />
      <Spacer size="lg" />
      {/* Table Options */}
      <div className="flex items-center justify-between">
        {/* Search bar */}
        <TableSearchBox placeholder="Search for a student" />

        {/* Buttons */}
        <div>
          <div className="w-52">
            <Button
              title="Bulk Upload Students"
              icon={<CloudUpload size={16} strokeWidth={2.5} />}
              variant="fill"
              loading={false}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table
        tableHeading={[
          { value: "Student Name", colSpan: "col-span-4" },
          { value: "Registration Number", colSpan: "col-span-2" },
          { value: "Gender", colSpan: "col-span-1" },
          { value: "Phone Number", colSpan: "col-span-2" },
          { value: "Assessments", colSpan: "col-span-2" },

          { value: "", colSpan: "col-span-1" },
        ]}
        tableData={
          pageData
            ? pageData.map((item, key) => [
                { value: item.fullName, colSpan: "col-span-4" },
                { value: item.regNumber, colSpan: "col-span-2" },
                { value: item.gender, colSpan: "col-span-1" },
                { value: item.phoneNumber, colSpan: "col-span-2" },
                {
                  value: item.assessments.length + " Taken",
                  colSpan: "col-span-2",
                },
                { value: item._id, colSpan: "col-span-1", type: "link" },
              ])
            : []
        }
        showSearch={false}
        showOptions={false}
      />

      {/* Loading */}
      {loading === "page" ? (
        <div className="flex items-center gap-2 mt-2 text-theme-gray">
          <Spinner />
          <div className="text-sm">Fetching data</div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

const Users = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default Users;
