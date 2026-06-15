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
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";

import { CloudUpload, Download, User2 } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageMetaData, User } from "./users.types";
import Preload from "@/components/preload";
import { useRole } from "@/lib/useRole";

const Page = () => {
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [openPassUpload, setOpenPassUpload] = useState(false);

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<User[] | null>(null);
  const [filteredPageData, setFilteredPageData] = useState<User[] | null>(null);
  const [pageMetaData, setPageMetaData] = useState<PageMetaData | null>(null);

  const [groups, setGroups] = useState<GroupType[] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);

  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterSubGroupId, setFilterSubGroupId] = useState("");
  const [filterGroup, setFilterGroup] = useState<GroupType | null>(null);

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const { data: session } = useSession();
  const { isSuperadmin } = useRole();

  const bulkUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      bulkUpload: { files: File[] };
      group: { value: string };
      subGroup: { value: string };
    };

    var formdata = new FormData();
    formdata.append("file", target.bulkUpload.files[0]);
    // formdata.append("group", target.group.value);
    // formdata.append("subGroup", target.subGroup.value);

    setLoading("bulkUpload");
    try {
      const api = await getAxios();
      const res = await api.post("/import/students", formdata);

      console.log(res);

      if (res.status == 200 || res.status == 201) {
        setLoading(null);
        setOpenBulkUpload(false);
        toast.success(res.data.message);
        // window.location.reload();
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

  const downloadTemplate = async () => {
    try {
      setLoading("downloadTemplate");
      const api = await getAxios();
      const res = await api.get("/import/template/students", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "students_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      setLoading(null);
    } catch (error) {
      toast.error("Failed to download template.", toastConfig);
      setLoading(null);
    }
  };

  const fetchStudents = async ({
    keyword,
    level,
    group,
    subGroup,
    page,
    loadingKey = "fetchStudents",
  }: {
    keyword: string;
    level: string;
    group: string;
    subGroup: string;
    page: number;
    loadingKey?: string;
  }) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(loadingKey);

    const query = new URLSearchParams({ pageNumber: String(page) });
    if (keyword) query.set("searchByKeyword", keyword);
    if (level) query.set("level", level);
    if (group) query.set("group", group);
    if (subGroup) query.set("subGroup", subGroup);

    try {
      const api = await getAxios();
      const res = await api.get(`/student/all?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 200) {
        setPageData(res.data.data.data);
        setFilteredPageData(res.data.data.data);
        setPageMetaData(() => {
          const { data, ...rest } = res.data.data;
          return rest;
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
    fetchStudents({
      keyword: filterKeyword,
      level: filterLevel,
      group: filterGroupId,
      subGroup: filterSubGroupId,
      page: targetPage,
      loadingKey: dir === "next" ? "nextPage" : "prevPage",
    });
  };

  const clearFilters = () => {
    setFilterKeyword("");
    setFilterLevel("");
    setFilterGroupId("");
    setFilterSubGroupId("");
    setFilterGroup(null);
    fetchStudents({ keyword: "", level: "", group: "", subGroup: "", page: 1 });
  };

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session?.user?.id) return;
    const timeout = setTimeout(() => {
      fetchStudents({
        keyword: filterKeyword,
        level: filterLevel,
        group: filterGroupId,
        subGroup: filterSubGroupId,
        page: 1,
        loadingKey: "search",
      });
    }, 350);
    return () => clearTimeout(timeout);
  }, [filterKeyword]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        // Get Students
        const res = await api.get("/student/all?pageNumber=1", {
          signal: controller.signal,
        });

        // Get Groups (Faculties)
        const groupRes = await api.get("/school/groups", {
          signal: controller.signal,
        });

        if (res.status === 200 && groupRes.status === 200) {
          console.log(res);
          setGroups(groupRes.data.data);
          setPageData(res.data.data.data);
          setFilteredPageData(res.data.data.data);
          setPageMetaData((prev) => {
            const { data, ...dataToKeep } = res.data.data;
            return dataToKeep;
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
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <PageNavigator
            navList={[
              { name: "Students", route: "/users" },
              ...(isSuperadmin
                ? [{ name: "Administrators", route: "/users/staff" }]
                : []),
            ]}
          />
          <Spacer size="lg" />

          {/* Table Options */}
          <div className="flex items-center justify-between">
            {/* Search bar */}
            <TableSearchBox
              placeholder="Search by name, reg number, email or phone"
              onChange={(e) => setFilterKeyword(e.target.value)}
            />

            {/* Buttons */}
            {isSuperadmin && (
              <div className="flex items-center gap-4">
                {/* Bulk Upload Students */}
                <div className="w-52">
                  <Button
                    title="Bulk Upload Students"
                    icon={<CloudUpload size={16} strokeWidth={2.5} />}
                    variant="fill"
                    loading={false}
                    onClick={() => setOpenBulkUpload((prev) => !prev)}
                  />
                </div>

                {/* Bulk Upload Passports */}
                <div className="w-52">
                  <Button
                    title="Bulk Upload Passports"
                    icon={<User2 size={16} strokeWidth={2.5} />}
                    variant="fill"
                    loading={false}
                    onClick={() => setOpenPassUpload((prev) => !prev)}
                  />
                </div>
              </div>
            )}
          </div>
          <Spacer size="md" />

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Level */}
            <Select
              value={filterLevel || "all"}
              onValueChange={(val) => {
                const newLevel = val === "all" ? "" : val;
                setFilterLevel(newLevel);
                fetchStudents({
                  keyword: filterKeyword,
                  level: newLevel,
                  group: filterGroupId,
                  subGroup: filterSubGroupId,
                  page: 1,
                });
              }}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="100">100L</SelectItem>
                <SelectItem value="200">200L</SelectItem>
                <SelectItem value="300">300L</SelectItem>
                <SelectItem value="400">400L</SelectItem>
                <SelectItem value="500">500L</SelectItem>
              </SelectContent>
            </Select>

            {/* Faculty */}
            <Select
              value={filterGroupId || "all"}
              onValueChange={(val) => {
                const newGroup = val === "all" ? "" : val;
                setFilterGroupId(newGroup);
                setFilterSubGroupId("");
                setFilterGroup(groups?.find((g) => g._id === newGroup) ?? null);
                fetchStudents({
                  keyword: filterKeyword,
                  level: filterLevel,
                  group: newGroup,
                  subGroup: "",
                  page: 1,
                });
              }}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="All Faculties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                {groups?.map((grp) => (
                  <SelectItem key={grp._id} value={grp._id}>
                    {grp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department */}
            <Select
              value={filterSubGroupId || "all"}
              onValueChange={(val) => {
                const newSubGroup = val === "all" ? "" : val;
                setFilterSubGroupId(newSubGroup);
                fetchStudents({
                  keyword: filterKeyword,
                  level: filterLevel,
                  group: filterGroupId,
                  subGroup: newSubGroup,
                  page: 1,
                });
              }}
              disabled={!filterGroup}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filterGroup?.subGroups.map((sg) => (
                  <SelectItem key={sg._id} value={sg._id}>
                    {sg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear */}
            {(filterKeyword ||
              filterLevel ||
              filterGroupId ||
              filterSubGroupId) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-theme-gray hover:text-accent cursor-pointer underline underline-offset-2"
              >
                Clear Filters
              </button>
            )}
          </div>
          <Spacer size="sm" />

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
              {`(${pageMetaData?.totalItems})`}
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
              { value: "Student Name", colSpan: "col-span-4" },
              { value: "Registration Number", colSpan: "col-span-2" },
              { value: "Level", colSpan: "col-span-1" },
              { value: "Phone Number", colSpan: "col-span-2" },
              { value: "Enrolled", colSpan: "col-span-2" },
              ...(isSuperadmin
                ? [{ value: "", colSpan: "col-span-1" }]
                : []),
            ]}
            tableData={
              filteredPageData
                ? filteredPageData.map((item, key) => [
                    { value: item?.fullName, colSpan: "col-span-4" },
                    { value: item?.regNumber, colSpan: "col-span-2" },
                    { value: item?.level, colSpan: "col-span-1" },
                    { value: item?.phoneNumber, colSpan: "col-span-2" },
                    {
                      value: prettyDate(item?.createdAt.split("T")[0]) || "-",
                      colSpan: "col-span-2",
                    },
                    ...(isSuperadmin
                      ? [
                          {
                            value: `users/${item._id}`,
                            colSpan: "col-span-1",
                            type: "link" as const,
                          },
                        ]
                      : []),
                  ])
                : []
            }
            showSearch={false}
            showOptions={false}
          />

          {/* Spacing */}
          <Spacer size="xl" />
          <Spacer size="xl" />

          {/* Dialogs - Student Bulk Upload */}
          <Dialog open={openBulkUpload} onOpenChange={setOpenBulkUpload}>
            <DialogContent
              onEscapeKeyDown={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
            >
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
                  Use the template provided, if there is an error, no student
                  will be uploaded. <br />
                  <br />
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    disabled={loading === "downloadTemplate"}
                    className="inline-flex items-center gap-1 text-accent underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading === "downloadTemplate" ? (
                      <Spinner className="size-3" />
                    ) : (
                      <Download size={12} />
                    )}
                    Download Upload Template
                  </button>
                </div>
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
        </>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
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
