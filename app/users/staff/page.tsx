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
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import {
  BulkImportResult,
  downloadImportTemplate,
  runBulkImport,
} from "@/lib/bulkImport";
import BulkImportSummary from "@/components/bulk-import-result";

import { CloudUpload, Download, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Preload from "@/components/preload";

// Role tokens accepted by the /admin/all?role= filter, per the API spec enum
const ROLE_FILTERS = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "invigilator", label: "Invigilator" },
  { value: "examination_officer", label: "Examination Officer" },
];

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
  const [roleFilter, setRoleFilter] = useState("");
  // Kept after the import so the skipped and failed rows stay readable
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const { data: session } = useSession();

  const fetchControllerRef = useRef<AbortController | null>(null);

  const fetchStaff = async (role: string) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading("roleFilter");

    const query = new URLSearchParams({ pageNumber: "1" });
    if (role) query.set("role", role);

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/all?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 200) {
        setPageData(res.data.data.data);
      }

      setLoading(null);
    } catch (error: any) {
      // A failed filter keeps the current rows on screen rather than
      // dropping the whole page into its error state
      if (error.name === "CanceledError") return;
      toast.error("Unable to filter administrators, please retry.", toastConfig);
      setLoading(null);
    }
  };

  const bulkUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      bulkUpload: { files: FileList };
    };
    const file = target.bulkUpload.files[0];
    if (!file) return;

    setLoading("bulkUpload");
    const result = await runBulkImport("faculty", file);
    setLoading(null);
    if (!result) return;

    setBulkResult(result);
    toast.success(
      `${result.created.length} account${result.created.length === 1 ? "" : "s"} imported`,
      toastConfig,
    );

    // Even a partial import changes the list, so it is always refetched
    fetchStaff(roleFilter);
  };

  const getTemplate = async () => {
    setLoading("facultyTemplate");
    await downloadImportTemplate("faculty");
    setLoading(null);
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
      const api = await getAxios();
      const res = await api.post("/admin/create", {
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
      const api = await getAxios();
      const res = await api.post("/student/bulk-passport", formdata);
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
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();

        // Get Students
        const res = await api.get("/admin/all?pageNumber=1", {
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
  }, [session?.user?.id]);

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
          <div className="flex items-center justify-between mb-4">
            {/* Role filter */}
            <div className="flex items-center gap-3">
              <Select
                value={roleFilter || "all"}
                onValueChange={(val) => {
                  const next = val === "all" ? "" : val;
                  setRoleFilter(next);
                  fetchStaff(next);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_FILTERS.map((item) => (
                    <SelectItem value={item.value} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {loading === "roleFilter" ? (
                <Spinner className="size-4 text-theme-gray" />
              ) : (
                ""
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-44">
                <Button
                  title="Bulk Upload"
                  variant="outline"
                  icon={<CloudUpload size={16} strokeWidth={2.5} />}
                  onClick={() => {
                    setBulkResult(null);
                    setOpenBulkUpload(true);
                  }}
                  loading={false}
                  type="button"
                />
              </div>

              <div className="w-42">
                <Button
                  title="Create Admin"
                  variant="fill"
                  icon={<User2 size={18} />}
                  onClick={() => setShowCreateDialog(true)}
                  loading={false}
                />
              </div>
            </div>
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

          {pageData.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-sm text-theme-gray">
              No administrators match this role.
            </div>
          ) : (
            ""
          )}

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

      {/* Dialogs - Faculty Bulk Upload */}
      <Dialog open={openBulkUpload} onOpenChange={setOpenBulkUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Administrators</DialogTitle>
            <DialogDescription className="pr-28">
              Upload an Excel file (.xlsx) of staff accounts. Emails that
              already exist are skipped.
            </DialogDescription>
          </DialogHeader>

          <form className="pr-28" onSubmit={bulkUpload}>
            {/* File Upload */}
            <Input
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
              Columns: Full Name, Email, Phone, Role, Password. Rows with
              role=student are rejected. <br />
              <br />
              <button
                type="button"
                onClick={getTemplate}
                disabled={loading === "facultyTemplate"}
                className="inline-flex items-center gap-1 text-accent underline underline-offset-2 disabled:opacity-50 cursor-pointer"
              >
                {loading === "facultyTemplate" ? (
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
