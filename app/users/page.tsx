"use client";

import Button from "@/components/button";
import PageNavigator from "@/components/sections/page-navigator";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";

import { CloudUpload } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const controller = new AbortController();
  const router = useRouter();
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
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
        level: string;
        createdAt: string;
        school: string;
      }[]
  >(null);
  const [groups, setGroups] = useState<GroupType[] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const { data: session } = useSession();

  const bulkUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      bulkUpload: { files: File[] };
      group: { value: string };
      subGroup: { value: string };
    };

    var formdata = new FormData();
    formdata.append("file", target.bulkUpload.files[0], "students.csv");
    formdata.append("group", target.group.value);
    formdata.append("subGroup", target.subGroup.value);

    setLoading("bulkUpload");
    try {
      const res = await localAxios.post("/student/bulk-upload", formdata);

      console.log(res);

      if (res.status == 200) {
        setLoading(null);
        setOpenBulkUpload(false);
        toast.success(res.data.message);
        window.location.reload();
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

        // Get Students
        const res = await localAxios.get("/student/all", {
          signal: controller.signal,
        });

        // Get Groups
        const groupRes = await localAxios.get("/school/groups", {
          signal: controller.signal,
        });

        if (res.status === 200 && groupRes.status === 201) {
          console.log(res.data.data);
          setGroups(groupRes.data.data);
          setPageData(res.data.data.data);
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
          { name: "Administrators", route: "/users/staff" },
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
              onClick={() => setOpenBulkUpload((prev) => !prev)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table
        tableHeading={[
          { value: "Student Name", colSpan: "col-span-4" },
          { value: "Registration Number", colSpan: "col-span-2" },
          { value: "Level", colSpan: "col-span-1" },
          { value: "Phone Number", colSpan: "col-span-2" },
          { value: "Enrolled", colSpan: "col-span-2" },
          { value: "", colSpan: "col-span-1" },
        ]}
        tableData={
          pageData
            ? pageData.map((item, key) => [
                { value: item?.fullName, colSpan: "col-span-4" },
                { value: item?.regNumber, colSpan: "col-span-2" },
                { value: item?.level, colSpan: "col-span-1" },
                { value: item?.phoneNumber, colSpan: "col-span-2" },
                {
                  value: prettyDate(item?.createdAt.split("T")[0]) || "-",
                  colSpan: "col-span-2",
                },
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

      <Dialog open={openBulkUpload} onOpenChange={setOpenBulkUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Students</DialogTitle>
            <DialogDescription className="pr-28">
              Add students to the database so that you can assign them to
              assessments later on.
            </DialogDescription>
          </DialogHeader>

          <form className="pr-28" onSubmit={bulkUpload}>
            {/* File Upload */}
            <Input
              id="bulkUpload"
              name="bulkUpload"
              type="file"
              className="cursor-pointer"
              required
            />
            <Spacer size="sm" />

            {/* Faculty */}
            <Select
              name="group"
              onValueChange={(val) => {
                if (!groups) return;
                const target = groups.find((grp) => grp._id == val);
                target && setSelectedGroup(target);
              }}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    groups && groups?.length > 1
                      ? "Choose Faculty"
                      : "No faculty created"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groups
                  ? groups.map((grp, key) => {
                      return (
                        <SelectItem value={grp._id} key={key}>
                          {grp.name}
                        </SelectItem>
                      );
                    })
                  : ""}
              </SelectContent>
            </Select>
            <Spacer size="sm" />

            {/* Department */}
            <Select name="subGroup" required>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    selectedGroup && selectedGroup?.subGroups?.length > 0
                      ? "Choose Department"
                      : "No deparment created"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedGroup?.subGroups ? (
                  <>
                    {selectedGroup.subGroups.map((grp, key) => (
                      <SelectItem value={grp._id} key={key}>
                        {grp.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  ""
                )}
              </SelectContent>
            </Select>
            <Spacer size="sm" />

            <Button
              title={"Upload File"}
              loading={loading === "bulkUpload"}
              variant={"fill"}
              icon={<CloudUpload size={20} />}
            />

            <Spacer size="md" />
            <div className="text-sm text-theme-gray">
              Use the template provided, if there is an error, no student will
              be uploaded.
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
