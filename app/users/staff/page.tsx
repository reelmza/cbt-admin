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
import CustomInput from "@/components/input";
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
import { toastConfig } from "@/utils/toastConfig";

import { CloudUpload, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Preload from "@/components/preload";

const Page = () => {
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [openPassUpload, setOpenPassUpload] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createRole, setCreateRole] = useState("admin");

  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] = useState<
    | null
    | {
        _id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        password: string;
        role: string;
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
    } catch (error: any) {
      console.log(error);

      if (error?.status == 400) {
        toast.error(
          "Error, Please check your user entries for duplicates",
          toastConfig,
        );
      }
      setLoading(null);
    }
  };

  const createAdmin = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      fullName: { value: string };
      email: { value: string };
      password: { value: string };
    };

    setLoading("createAdmin");
    try {
      const res = await localAxios.post("/admin/create", {
        fullName: target.fullName.value,
        email: target.email.value,
        password: target.password.value,
        role: createRole,
      });

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev ? [res.data.data, ...prev] : [res.data.data],
        );
        setShowCreateDialog(false);
        toast.success("Admin created successfully");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message,
        toastConfig,
      );
    }
    setLoading(null);
  };

  const passUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      passports: { files: File[] };
    };

    var formdata = new FormData();
    formdata.append("file", target.passports.files[0], "passport.zip");

    setLoading("passUpload");
    try {
      const res = await localAxios.post("/student/bulk-passport", formdata);
      console.log(res);
      if (res.status == 200) {
        setLoading(null);
        setOpenBulkUpload(false);
        toast.success(res.data.message);
      }
    } catch (error: any) {
      console.log(error);

      if (error?.status == 400) {
        toast.error("Error occured, Please check your file", toastConfig);
      }
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);

        // Get Students
        const res = await localAxios.get("/admin/all?pageNumber=1", {
          signal: controller.signal,
        });

        if (res.status === 200) {
          console.log(res);
          setPageData(res.data.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          if (error.status === 403) {
            setErrorMessage(
              "Access Denied$You are not authorized to access this resource.",
            );
          }
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
      {pageData && (
        <>
          <PageNavigator
            navList={[
              { name: "Students", route: "/users" },
              { name: "Administrators", route: "/users/staff" },
            ]}
          />
          <Spacer size="lg" />

          {/* Actions */}
          <div className="w-42 float-right justify-end mb-4">
            <Button
              title="Create Admin"
              variant="fill"
              icon={<User2 size={18} />}
              onClick={() => setShowCreateDialog(true)}
              loading={false}
            />
          </div>

          {/* Table */}
          <Table
            tableHeading={[
              { value: "Admin Name", colSpan: "col-span-3" },
              { value: "Email", colSpan: "col-span-3" },
              { value: "Type", colSpan: "col-span-1" },
              { value: "Phone Number", colSpan: "col-span-2" },
              { value: "Enrolled", colSpan: "col-span-2" },
              { value: "ID", colSpan: "col-span-1" },
            ]}
            tableData={
              pageData
                ? pageData.map((item, key) => [
                    { value: item?.fullName, colSpan: "col-span-3" },
                    { value: item?.email, colSpan: "col-span-3" },
                    { value: item?.role, colSpan: "col-span-1" },
                    { value: item?.phoneNumber, colSpan: "col-span-2" },
                    {
                      value: prettyDate(item?.createdAt.split("T")[0]) || "-",
                      colSpan: "col-span-2",
                    },
                    {
                      value: `/${item._id.slice(0, 5)}...`,
                      colSpan: "col-span-1",
                    },
                  ])
                : []
            }
            showSearch={false}
            showOptions={false}
          />

          {/* Spacing */}
          <Spacer size="xl" />
          <Spacer size="xl" />
        </>
      )}

      <Preload
        loading={loading}
        pageData={pageData ? true : false}
        errorMessage={errorMessage}
      />

      {/* Dialogs - Student Bulk Upload */}
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

      {/* Dialogs - Create Admin */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
            <DialogDescription className="pr-28">
              Add a new administrator to the system.
            </DialogDescription>
          </DialogHeader>

          <form className="pr-28" onSubmit={createAdmin}>
            <CustomInput
              name="fullName"
              type="text"
              placeholder="Enter full name"
              required
            />
            <Spacer size="sm" />

            <CustomInput
              name="email"
              type="email"
              placeholder="Enter email address"
              required
            />
            <Spacer size="sm" />

            <CustomInput
              name="password"
              type="password"
              placeholder="Enter password"
              required
            />
            <Spacer size="sm" />

            <Select
              name="role"
              defaultValue="admin"
              onValueChange={(val) => setCreateRole(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super-admin">Super Admin</SelectItem>
                <SelectItem value="invigilator">Invigilator</SelectItem>
              </SelectContent>
            </Select>
            <Spacer size="md" />

            <Button
              title="Create Admin"
              loading={loading === "createAdmin"}
              variant="fill"
              icon={<User2 size={20} />}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogs - Student Passport Upload */}
      <Dialog open={openPassUpload} onOpenChange={setOpenPassUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Passports</DialogTitle>
            <DialogDescription className="pr-28">
              Upload passport zipped file
            </DialogDescription>
          </DialogHeader>

          <form className="pr-28" onSubmit={passUpload}>
            {/* File Upload */}
            <Input
              id="passports"
              name="passports"
              type="file"
              className="cursor-pointer"
              required
            />
            <Spacer size="md" />

            {/* Submit Button */}
            <Button
              title={"Upload File"}
              loading={loading === "passUpload"}
              variant={"fill"}
              icon={<CloudUpload size={20} />}
            />
            <Spacer size="md" />

            <div className="text-sm text-theme-gray">
              All passports will be matched to corresponding registration
              numbers.
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
