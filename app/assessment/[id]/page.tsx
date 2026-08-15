"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAxios } from "@/lib/axios";
import { SessionProvider, useSession } from "next-auth/react";
import {
  use,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { PageDataType } from "./id.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toastConfig } from "@/utils/toastConfig";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  ChartLine,
  Check,
  Database,
  FileText,
  Layers,
  ListCheck,
  MapPinCheckInside,
  Printer,
  Sheet,
  X,
} from "lucide-react";
import Link from "next/link";
import Preload from "@/components/preload";
import { useRole } from "@/lib/useRole";

type ExportFilter = {
  group: string;
  subGroup: string;
  level: string;
  status: string;
};

const EMPTY_EXPORT_FILTER: ExportFilter = {
  group: "",
  subGroup: "",
  level: "",
  status: "",
};

type ResultBreakdown = {
  assessment: {
    id: string;
    title: string;
    totalQuestions: number;
    totalPossibleScore: number;
  };
  results: {
    sn: number;
    student: {
      id: string;
      fullName: string;
      regNo: string;
      level: string;
    };
    scores: {
      objective: number;
      subjective: number;
      theory: number;
      total: number;
    };
    sectionScores: { title: string; score: number; maxScore: number }[];
    percentage: number;
  }[];
};

const LEVELS = ["100", "200", "300", "400", "500"];

const SUBMISSION_STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "in-progress", label: "In Progress" },
  { value: "locked", label: "Locked" },
  { value: "disconnected", label: "Disconnected" },
];

// Only the filters the user actually set are sent, so an untouched dialog
// produces the same request the buttons made before there were filters
const exportParams = (filter: ExportFilter) =>
  Object.fromEntries(Object.entries(filter).filter(([, value]) => value));

const ExportFilters = ({
  filter,
  setFilter,
  groups,
}: {
  filter: ExportFilter;
  setFilter: Dispatch<SetStateAction<ExportFilter>>;
  groups: GroupType[] | null;
}) => (
  <>
    {/* Faculty */}
    <Select
      value={filter.group || "all"}
      onValueChange={(val) =>
        // Departments belong to a faculty, so changing the faculty drops any
        // department picked under the previous one
        setFilter((prev) => ({
          ...prev,
          group: val === "all" ? "" : val,
          subGroup: "",
        }))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Faculty" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All faculties</SelectItem>
        {groups
          ? groups.map((grp) => (
              <SelectItem value={grp._id} key={grp._id}>
                {grp.name}
              </SelectItem>
            ))
          : ""}
      </SelectContent>
    </Select>
    <Spacer size="sm" />

    {/* Department */}
    <Select
      value={filter.subGroup || "all"}
      onValueChange={(val) =>
        setFilter((prev) => ({ ...prev, subGroup: val === "all" ? "" : val }))
      }
      disabled={!filter.group}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            filter.group ? "Select Department" : "Select a faculty first"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All departments</SelectItem>
        {groups
          ?.find((grp) => grp._id === filter.group)
          ?.subGroups.map((sub) => (
            <SelectItem value={sub._id} key={sub._id}>
              {sub.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
    <Spacer size="sm" />

    {/* Level */}
    <Select
      value={filter.level || "all"}
      onValueChange={(val) =>
        setFilter((prev) => ({ ...prev, level: val === "all" ? "" : val }))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Level" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All levels</SelectItem>
        {LEVELS.map((level) => (
          <SelectItem value={level} key={level}>
            {level}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Spacer size="sm" />

    {/* Status */}
    <Select
      value={filter.status || "all"}
      onValueChange={(val) =>
        setFilter((prev) => ({ ...prev, status: val === "all" ? "" : val }))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {SUBMISSION_STATUSES.map((item) => (
          <SelectItem value={item.value} key={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </>
);

const Page = ({ id }: { id: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isSuperadmin, isAdmin } = useRole();

  const [loading, setLoading] = useState<string | null>("page");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageDataType | null>(null);
  const [groups, setGroups] = useState<GroupType[] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [departmentOnly, setDepartmentOnly] = useState(false);
  const [showInvigilatorDialog, setShowInvigilatorDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkAssignFile, setBulkAssignFile] = useState<File | null>(null);
  const [showBulkUnassignDialog, setShowBulkUnassignDialog] = useState(false);
  const [bulkUnassignFile, setBulkUnassignFile] = useState<File | null>(null);
  const [admins, setAdmins] = useState<
    { _id: string; fullName: string }[] | null
  >(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [showExportEntriesDialog, setShowExportEntriesDialog] = useState(false);
  const [entriesFilter, setEntriesFilter] =
    useState<ExportFilter>(EMPTY_EXPORT_FILTER);
  // Holds the chosen output format; doubles as the results dialog's open state
  const [resultsFormat, setResultsFormat] = useState<string | null>(null);
  const [resultsFilter, setResultsFilter] =
    useState<ExportFilter>(EMPTY_EXPORT_FILTER);
  // Fetched on demand; doubles as the breakdown dialog's open state
  const [breakdown, setBreakdown] = useState<ResultBreakdown | null>(null);
  const globalController = new AbortController();

  // Fetch all admins for invigilator dropdown
  const fetchAdmins = async () => {
    try {
      const api = await getAxios();
      const res = await api.get("/admin/all");
      if (res.status === 200) {
        setAdmins(res.data.data.data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message,
        toastConfig,
      );
    }
  };

  // Assign invigilator
  const assignInvigilator = async () => {
    if (!selectedAdminId) return;
    setLoading("assignInvigilator");
    try {
      const api = await getAxios();
      const res = await api.post(
        `/admin/assign-invigilator/${id}`,
        { userId: selectedAdminId },
        { signal: globalController.signal },
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Invigilator assigned successfully", toastConfig);
        setShowInvigilatorDialog(false);
        setSelectedAdminId("");
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Remove invigilator
  const removeInvigilator = async (adminId: string) => {
    setLoading(`removeInvigilator-${adminId}`);
    try {
      const api = await getAxios();
      const res = await api.delete(
        `/admin/remove-invigilator/${id}/${adminId}`,
        { signal: globalController.signal },
      );

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev
            ? {
                ...prev,
                invigilators: prev.invigilators.filter((i) => i !== adminId),
              }
            : prev,
        );
        toast.success("Invigilator removed successfully", toastConfig);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update assessment status
  const updateStatus = async (val: string) => {
    if (!pageData) return;
    setLoading("updateStatus");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { status: val },
        {
          signal: globalController.signal,
        },
      );

      if (res.status === 201) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update assessment duration
  const updateDuration = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      duration: { value: string };
    };

    setLoading("updateDuration");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { timeLimit: Number(target.duration.value) },
        {
          signal: globalController.signal,
        },
      );

      if (res.status === 201 || res.status === 200) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success(
          `Successfully assigned ${target.duration.value} mintues to test`,
          toastConfig,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update assessment start date
  const updateStartDate = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      startDate: { value: string };
    };

    setLoading("updateStartDate");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { startDate: new Date(target.startDate.value).toISOString() },
        {
          signal: globalController.signal,
        },
      );

      if (res.status === 201) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success("Start date updated successfully");
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update assessment due date
  const updateDueDate = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      dueDate: { value: string };
    };

    setLoading("updateDueDate");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { dueDate: new Date(target.dueDate.value).toISOString() },

        {
          signal: globalController.signal,
        },
      );

      if (res.status === 201) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success("Due date updated successfully");
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update total marks
  const updateTotalMarks = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      totalMarks: { value: string };
    };

    setLoading("updateTotalMarks");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { totalMarks: Number(target.totalMarks.value) },
        { signal: globalController.signal },
      );

      if (res.status === 201 || res.status === 200) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success("Total marks updated successfully", toastConfig);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update pass mark
  const updatePassMark = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      passmark: { value: string };
    };

    setLoading("updatePassMark");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/update-assessment/${id}`,
        { passmark: Number(target.passmark.value) },
        { signal: globalController.signal },
      );

      if (res.status === 201 || res.status === 200) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success("Pass mark updated successfully", toastConfig);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Start assessment
  const authorizeAss = async () => {
    if (!pageData) return;
    setLoading("authorizeAss");
    try {
      const api = await getAxios();
      const res = await api.patch(`/assessment/authorize/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 201 || res.status === 200) {
        console.log(res);
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // End assessment
  const endAssessment = async () => {
    if (!pageData) return;
    setLoading("endAssessment");
    try {
      const api = await getAxios();
      const res = await api.patch(`/assessment/end/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 200) {
        console.log(res);
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Restart assessment
  const restartAss = async () => {
    if (!pageData) return;
    setLoading("restartAss");
    try {
      const api = await getAxios();
      const res = await api.patch(`/assessment/reset-status/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 200) {
        console.log(res);
        setPageData((prev) => {
          if (prev) {
            return { ...prev, endReason: false, course: prev?.course };
          }

          return prev;
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Update shuffle questions sections
  const updateShuffle = async (sections: string[]) => {
    setLoading("toggleShuffle");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/assessment/update-assessment/${id}`,
        { shuffleQuestions: sections },
        { signal: globalController.signal },
      );

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev ? { ...prev, shuffleQuestions: sections } : prev,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Toggle browser restrictions
  const toggleBrowserRestriction = async (val: boolean) => {
    setLoading("toggleBrowserRestriction");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/assessment/update-assessment/${id}`,
        { allowBrowserRestriction: val },
        { signal: globalController.signal },
      );

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev ? { ...prev, allowBrowserRestriction: val } : prev,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Archive assessment
  const archiveAss = async () => {
    if (!pageData) return;
    setLoading("archiveAss");
    try {
      const api = await getAxios();
      const res = await api.post(`/admin/archive/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Assessment archived successfully", toastConfig);
        router.push("/assessment");
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Delete assessment
  const deleteAss = async () => {
    if (!pageData) return;
    setLoading("deleteAss");
    try {
      const api = await getAxios();
      const res = await api.delete(`/assessment/delete/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 200) {
        console.log(res);
        router.push("/assessment");
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Assign to faculty/department
  const assignToFaculty = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      action: { value: string };
      level: { value: string };
      group: { value: string };
      subgroup: { value: string };
    };

    // If no level selected
    if (!target.level.value) {
      toast.error("Please select a level", toastConfig);
      return;
    }

    // If no action
    if (!target.action.value) {
      toast.error("Please select action", toastConfig);
      return;
    }

    setLoading("assignToFaculty");
    try {
      const api = await getAxios();
      const res = await api.post(
        `/assessment/${target.action.value}/${id}`,
        {
          level: Number(target.level.value),
          ...(target.group.value &&
            !departmentOnly && {
              group: target.group.value,
            }),
          ...(target.subgroup.value && { subGroup: target.subgroup.value }),
        },
        {
          signal: globalController.signal,
        },
      );

      if (res.status === 200) {
        toast.success(
          `Assessment ${
            target.action.value === "assign" ? "Assigned" : "Unassigned"
          } successfully`,
          toastConfig,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Assign to student
  const assignToStudent = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      regNumber: { value: string };
    };

    setLoading("assignToStudent");
    try {
      const api = await getAxios();

      const studentRes = await api.get(`/student/all`, {
        params: { searchByKeyword: target.regNumber.value },
      });

      if (studentRes.status !== 200 && studentRes.status !== 201)
        throw new Error();

      const targetStudent = studentRes.data.data.data.find(
        (sd: any) => sd.regNumber === target.regNumber.value,
      );
      if (!targetStudent) {
        toast.error("Student does not exist", toastConfig);
        throw new Error("Student does not exist");
      }

      const res = await api.post(
        `/assessment/assign/${id}`,
        { students: [targetStudent._id] },
        {
          signal: globalController.signal,
        },
      );

      if (res.status == 200) {
        toast.success(
          `${targetStudent.fullName} added to assessment successfully`,
          toastConfig,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Download bulk assign template
  const downloadAssignTemplate = async () => {
    setLoading("downloadAssignTemplate");
    try {
      const api = await getAxios();
      const res = await api.get("/import/template/assign-students", {
        responseType: "blob",
        signal: globalController.signal,
      });

      if (res.status === 200) {
        const blob = res.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "assign-students-template.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Bulk assign students via xlsx
  const bulkAssignStudents = async () => {
    if (!bulkAssignFile) {
      toast.error("Please select a file", toastConfig);
      return;
    }

    setLoading("bulkAssignStudents");
    try {
      const api = await getAxios();
      const formData = new FormData();
      formData.append("file", bulkAssignFile);

      const res = await api.post(`/import/assign-students/${id}`, formData, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message, toastConfig);
        setShowBulkAssignDialog(false);
        setBulkAssignFile(null);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Download bulk unassign template
  const downloadUnassignTemplate = async () => {
    setLoading("downloadUnassignTemplate");
    try {
      const api = await getAxios();
      const res = await api.get("/import/template/unassign-students", {
        responseType: "blob",
        signal: globalController.signal,
      });

      if (res.status === 200) {
        const blob = res.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "unassign-students-template.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Bulk unassign students via xlsx
  const bulkUnassignStudents = async () => {
    if (!bulkUnassignFile) {
      toast.error("Please select a file", toastConfig);
      return;
    }

    setLoading("bulkUnassignStudents");
    try {
      const api = await getAxios();
      const formData = new FormData();
      formData.append("file", bulkUnassignFile);

      const res = await api.post(`/import/unassign-students/${id}`, formData, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message, toastConfig);
        setShowBulkUnassignDialog(false);
        setBulkUnassignFile(null);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message || error?.message,
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  // Generate assessement entries
  const generateAssEntries = async () => {
    setLoading("generateAssEntries");
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/export-submission/${id}`,

        {
          params: exportParams(entriesFilter),
          responseType: "blob",
          signal: globalController.signal,
        },
      );

      if (res.status === 200) {
        const blob = res.data;
        const url = URL.createObjectURL(blob);

        // Download file
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pageData?.course.code} - Entries`;
        a.click();

        URL.revokeObjectURL(url);
        setShowExportEntriesDialog(false);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        // The dialog stays open on failure so the filter can be adjusted
        toast.error(
          "Unable to generate submissions, please retry.",
          toastConfig,
        );
        setLoading(null);
        console.log(error);
      }
    }
  };

  // Generate assessment results
  const generateAssResults = async (output: String) => {
    setLoading(`generateResults-${output}`);
    try {
      const api = await getAxios();
      const res = await api.get(
        `/assessment/export-result/${id}`,

        {
          params: {
            fileType: output,
            ...exportParams(resultsFilter),
          },
          responseType: "blob",
          signal: globalController.signal,
        },
      );

      if (res.status === 200) {
        const blob = res.data;
        const url = URL.createObjectURL(blob);

        // Download file
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pageData?.course.code} - Results`;
        a.click();

        URL.revokeObjectURL(url);
        setResultsFormat(null);
      }

      if (res.status === 400) {
        toast.error(
          "No results prepared for this assessment yet.",
          toastConfig,
        );
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        // The dialog stays open on failure so the filter can be adjusted
        toast.error("Unable to generate results, please retry.", toastConfig);
        setLoading(null);
        console.log(error);
      }
    }
  };

  // Fetch the per-student result breakdown
  const fetchResultBreakdown = async () => {
    setLoading("resultBreakdown");
    try {
      const api = await getAxios();
      const res = await api.get(`/assessment/assessment-results/${id}`, {
        signal: globalController.signal,
      });

      if (res.status === 200) {
        setBreakdown(res.data.data);
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        toast.error(
          error?.response?.data?.message ||
            "Unable to load the result breakdown, please retry.",
          toastConfig,
        );
        setLoading(null);
      }
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      try {
        const api = await getAxios();
        const res = await api.get(`/admin/assessment/${id}`, {
          signal: controller.signal,
        });

        // Get Groups
        const groupRes = await api.get("/admin/groups", {
          signal: controller.signal,
        });

        if (res.status === 201 && groupRes.status === 200) {
          setGroups(groupRes.data.data);
          setPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          const status = error?.response?.status;
          if (status === 403) {
            setErrorMessage(
              "Access Denied$You don't have permission to view this assessment.",
            );
          } else if (status === 404) {
            setErrorMessage(
              "Assessment Not Found$This assessment does not exist or may have been deleted.",
            );
          } else {
            setErrorMessage(
              "Something went wrong$The assessment could not be loaded. Please try again.",
            );
          }
          setLoading("pageError");
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id]);

  const canControl =
    isSuperadmin || (isAdmin && session?.user?.id === pageData?.createdBy);

  // Sections are per assessment, but a student who skipped one may be missing
  // it, so the columns come from the union across every result
  const sectionTitles = breakdown
    ? [
        ...new Set(
          breakdown.results.flatMap(
            (item) => item.sectionScores?.map((sec) => sec.title) ?? [],
          ),
        ),
      ]
    : [];

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="w-full min-h-full">
            {/* Title */}
            <div>
              <div className="text-2xl font-semibold font-serif">
                {pageData.course.code}
              </div>
              <div className="text-theme-gray">{pageData.course.title}</div>
            </div>
            <Spacer size="md" />

            {/* Top Cards*/}
            <div className="grid grid-cols-12 gap-4">
              {[
                { title: "Status", value: pageData.status },

                {
                  title: "Questions",
                  value: pageData.sections.reduce((acc, sct) => {
                    if (!sct.questions || sct.questions.length < 1) {
                      return acc;
                    }

                    return acc + sct.questions.length;
                  }, 0),
                },
                { title: "Total Marks", value: pageData.totalMarks },
                { title: "Time Allocated", value: pageData.timeLimit + " min" },
              ].map((card, key) => {
                return (
                  <div
                    key={key}
                    className="col-span-3 p-5 rounded-lg border flex flex-col gap-5"
                  >
                    <div className="text-theme-gray text-sm">{card.title}</div>

                    <div className="flex flex-col justify-end h-10">
                      {/* Badge Values */}
                      {card.title === "Vissibility" && (
                        <div
                          className={`w-fit text-xs px-2 py-0.5 rounded-sm mb-1 ${
                            card.value == "open"
                              ? "text-emerald-600 bg-emerald-100"
                              : ""
                          }`}
                        >
                          {card.value}
                        </div>
                      )}

                      {/* Normal Values */}
                      {card.title !== "Vissibility" && (
                        <div className={`text-2xl font-bold`}>{card.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Spacer size="lg" />

            {/* Control Cards*/}
            <div
              className={`grid grid-cols-12 gap-4 ${
                canControl ? "" : "opacity-50 pointer-events-none select-none"
              }`}
              aria-disabled={!canControl}
            >
              {/* Left Cards */}
              <div className="col-span-5 border rounded-md p-5">
                {/* Test Duration */}
                <div className="text-sm text-theme-gray">
                  Test Duration (in minutes e.g 40 or 120)
                </div>
                <Spacer size="sm" />

                <form
                  className="flex items-center gap-4"
                  onSubmit={updateDuration}
                >
                  <Input
                    defaultValue={pageData.timeLimit.toString() || ""}
                    name="duration"
                    type="number"
                    placeholder="Enter duration in minutes"
                  />

                  <div className="w-32 shrink-0">
                    <Button
                      type="submit"
                      title="Save"
                      loading={loading == `updateDuration`}
                      variant="outline"
                    />
                  </div>
                </form>
                <Spacer size="md" />

                {/* Test Status */}
                <div className="text-sm text-theme-gray">Test Status</div>
                <Spacer size="md" />

                <div className="flex flex-wrap items-center gap-2">
                  <div className="grow">
                    <div className="h-10 w-full border rounded-md p-3 flex items-center text-sm">
                      {/* Ended by admin */}
                      {pageData?.authorizedToStart && pageData.endReason
                        ? pageData.endReason
                        : ""}

                      {pageData?.authorizedToStart && !pageData.endReason
                        ? "Ongoing"
                        : ""}

                      {/* Not started */}
                      {!pageData.authorizedToStart && !pageData.endReason
                        ? "Not cleared to start"
                        : ""}
                    </div>
                  </div>

                  {/* Exam not started */}
                  {!pageData.authorizedToStart && (
                    <div className="shrink-0 w-38">
                      <Button
                        title={"Start Exam"}
                        type="button"
                        variant="fill"
                        loading={loading === "authorizeAss"}
                        onClick={authorizeAss}
                      />
                    </div>
                  )}

                  {/* Exam ongoing, not ended - End button*/}
                  {pageData.authorizedToStart && !pageData.endReason && (
                    <div className="shrink-0 w-38">
                      <Button
                        title="End Exam"
                        type="button"
                        variant="fillErrorOutline"
                        loading={loading === "endAssessment"}
                        onClick={endAssessment}
                      />
                    </div>
                  )}

                  {/* Exam ended,  Restart button*/}
                  {pageData.endReason && (
                    <div className="shrink-0 w-38">
                      <Button
                        title="Restart Exam"
                        type="button"
                        variant="fill"
                        loading={loading === "restartAss"}
                        onClick={restartAss}
                      />
                    </div>
                  )}
                </div>
                <Spacer size="md" />

                {/* Start Date */}
                <div className="text-sm text-theme-gray">Start Date</div>
                <Spacer size="sm" />
                <form
                  className="flex items-center gap-4"
                  onSubmit={updateStartDate}
                >
                  <Input
                    defaultValue={pageData.startDate.split("T")[0] || ""}
                    name="startDate"
                    type="date"
                    placeholder=""
                  />

                  <div className="w-32 shrink-0">
                    <Button
                      type="submit"
                      title="Save"
                      loading={loading === "updateStartDate"}
                      variant="outline"
                    />
                  </div>
                </form>
                <Spacer size="md" />

                {/* Due Date */}
                <div className="text-sm text-theme-gray">Due Date</div>
                <Spacer size="sm" />
                <form
                  className="flex items-center gap-4"
                  onSubmit={updateDueDate}
                >
                  <Input
                    defaultValue={pageData.dueDate.split("T")[0] || ""}
                    name="dueDate"
                    type="date"
                    placeholder=""
                  />

                  <div className="w-32 shrink-0">
                    <Button
                      type="submit"
                      title="Save"
                      loading={loading === "updateDueDate"}
                      variant="outline"
                    />
                  </div>
                </form>

                <Spacer size="md" />

                {/* Total Marks */}
                <div className="text-sm text-theme-gray">Total Marks</div>
                <Spacer size="sm" />
                <form
                  className="flex items-center gap-4"
                  onSubmit={updateTotalMarks}
                >
                  <Input
                    defaultValue={pageData.totalMarks.toString()}
                    name="totalMarks"
                    type="number"
                    placeholder="Enter total marks"
                  />
                  <div className="w-32 shrink-0">
                    <Button
                      type="submit"
                      title="Save"
                      loading={loading === "updateTotalMarks"}
                      variant="outline"
                    />
                  </div>
                </form>
                <Spacer size="md" />

                {/* Pass Mark */}
                <div className="text-sm text-theme-gray">Pass Mark (%)</div>
                <Spacer size="sm" />
                <form
                  className="flex items-center gap-4"
                  onSubmit={updatePassMark}
                >
                  <Input
                    defaultValue={pageData.passmark?.toString() ?? ""}
                    name="passmark"
                    type="number"
                    placeholder="Enter pass mark percentage"
                  />
                  <div className="w-32 shrink-0">
                    <Button
                      type="submit"
                      title="Save"
                      loading={loading === "updatePassMark"}
                      variant="outline"
                    />
                  </div>
                </form>
                <Spacer size="md" />

                {/* Shuffle Questions */}
                <div className="text-sm text-theme-gray">Shuffle Questions</div>
                <Spacer size="sm" />
                <div className="flex items-center flex-wrap gap-2">
                  {(
                    [
                      "multiple_choice",
                      "multiple_select",
                      "subjective",
                      "theory",
                    ] as const
                  ).map((section) => {
                    const active = (pageData.shuffleQuestions ?? []).includes(
                      section,
                    );
                    return (
                      <button
                        key={section}
                        type="button"
                        disabled={loading === "toggleShuffle"}
                        onClick={() => {
                          const current = pageData.shuffleQuestions ?? [];
                          const next = active
                            ? current.filter((s) => s !== section)
                            : [...current, section];
                          updateShuffle(next);
                        }}
                        className={`cursor-pointer capitalize text-xs px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                          active
                            ? "bg-accent text-white border-accent"
                            : "text-theme-gray border-border hover:border-accent/50"
                        }`}
                      >
                        {section}
                      </button>
                    );
                  })}
                </div>
                <Spacer size="md" />

                {/* Browser Restrictions */}
                <div className="text-sm text-theme-gray">
                  Browser Restrictions
                </div>
                <Spacer size="sm" />
                <div className="flex items-center gap-3">
                  <Switch
                    checked={pageData.allowBrowserRestriction ?? false}
                    onCheckedChange={toggleBrowserRestriction}
                    disabled={loading === "toggleBrowserRestriction"}
                  />
                  <Label className="text-sm text-accent-dim">
                    {pageData.allowBrowserRestriction ? "Enabled" : "Disabled"}
                  </Label>
                </div>

                <Spacer size="xl" />

                {/* Archive assessment */}
                <div className="w-48">
                  <Button
                    title={"Archive Assessment"}
                    loading={loading === "archiveAss"}
                    variant={"fillErrorOutline"}
                    onClick={archiveAss}
                  />
                </div>

                {/* Delete assessment */}
                <div className="w-48 hidden">
                  <Button
                    title={"Delete Assessment"}
                    loading={loading === "deleteAss"}
                    variant={"fillErrorOutline"}
                    onClick={deleteAss}
                  />
                </div>
              </div>

              {/* Right Cards */}
              <div className="col-span-7 border rounded-md p-5">
                {/* Assign students */}
                <div className="text-sm text-theme-gray">
                  Assign to level, faculty and/or department
                </div>
                <Spacer size="sm" />

                <form onSubmit={assignToFaculty}>
                  {/* Action */}
                  <Select name="action">
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue placeholder={"Select Action"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"assign"}>Assign</SelectItem>
                      <SelectItem value={"unassign-bulk"}>Unassign</SelectItem>
                    </SelectContent>
                  </Select>
                  <Spacer size="sm" />

                  {/* Level */}
                  <Select name="level">
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue placeholder={"Select Level"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"100"}>100</SelectItem>
                      <SelectItem value={"200"}>200</SelectItem>
                      <SelectItem value={"300"}>300</SelectItem>
                      <SelectItem value={"400"}>400</SelectItem>
                      <SelectItem value={"500"}>500</SelectItem>
                    </SelectContent>
                  </Select>
                  <Spacer size="sm" />

                  {/* Faculty/department and button */}
                  <div className="w-full flex items-center gap-4">
                    {/* Faculty */}
                    <Select
                      name="group"
                      onValueChange={(val) => {
                        if (!groups) return;
                        const target = groups.find((grp) => grp._id == val);
                        target && setSelectedGroup(target);
                      }}
                      disabled={departmentOnly}
                    >
                      <SelectTrigger className="w-full max-w-48">
                        <SelectValue
                          placeholder={
                            groups && groups?.length < 1
                              ? "No faculties"
                              : "Select Faculty"
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

                    {/* Department */}
                    <Select name="subgroup">
                      <SelectTrigger className="max-w-42 min-w-42">
                        <SelectValue
                          placeholder={
                            selectedGroup && selectedGroup.subGroups?.length < 1
                              ? "No department"
                              : "Select Department"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGroup
                          ? selectedGroup.subGroups.map((grp, key) => {
                              return (
                                <SelectItem value={grp._id} key={key}>
                                  {grp.name}
                                </SelectItem>
                              );
                            })
                          : ""}
                      </SelectContent>
                    </Select>

                    <div className="w-38 shrink-0">
                      <Button
                        type="submit"
                        title="Proceed"
                        loading={loading === "assignToFaculty"}
                        variant="outline"
                      />
                    </div>
                  </div>
                </form>

                <Spacer size="lg" />

                {/* Assign to regNumber (STUDENT)*/}
                <div className="text-sm text-theme-gray">Assign to student</div>
                <Spacer size="sm" />

                <form
                  className="flex items-center gap-4"
                  onSubmit={assignToStudent}
                >
                  <Input
                    name="regNumber"
                    type="text"
                    placeholder="Enter registration number"
                  />

                  <div className="w-38 shrink-0">
                    <Button
                      type="submit"
                      loading={loading === "assignToStudent"}
                      title="Assign"
                      variant="outline"
                    />
                  </div>
                </form>
                <Spacer size="lg" />

                {/* Bulk assign / unassign students */}
                <div className="text-sm text-theme-gray">
                  Bulk assign students (carryover / borrowed course)
                </div>
                <Spacer size="sm" />
                <div className="flex items-center gap-3">
                  <div className="w-42">
                    <Button
                      type="button"
                      title="Bulk Assign"
                      loading={false}
                      variant="outline"
                      onClick={() => setShowBulkAssignDialog(true)}
                    />
                  </div>
                  <div className="w-42">
                    <Button
                      type="button"
                      title="Bulk Unassign"
                      loading={false}
                      variant="outline"
                      onClick={() => setShowBulkUnassignDialog(true)}
                    />
                  </div>
                </div>
                <Spacer size="lg" />

                {/* Results and Entries Management*/}
                <div className="text-sm text-theme-gray">
                  Results and Entries Management
                </div>
                <Spacer size="sm" />

                {/* Generate Entries */}
                <div className="border-b h-10 flex items-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setEntriesFilter(EMPTY_EXPORT_FILTER);
                      setShowExportEntriesDialog(true);
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {loading === "generateAssEntries" ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Database size={14} />
                    )}
                    Generate Submissions (Scripts)
                  </button>
                </div>

                {/* Mark Submissions */}
                <div className="border-b h-12 flex items-center text-sm">
                  <Link
                    href={`/assessment/${id}/marking`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>View/Mark Submissions</span>
                  </Link>
                </div>

                {/* Result Breakdown */}
                <div className="border-b h-12 flex items-center text-sm">
                  <button
                    type="button"
                    onClick={fetchResultBreakdown}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {loading === "resultBreakdown" ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Layers size={16} />
                    )}
                    <span>Result Breakdown</span>
                  </button>
                </div>

                {/* Analytics*/}
                <div className="border-b h-12 flex items-center text-sm">
                  <Link
                    href={`/assessment/${id}/analytics`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ChartLine size={16} />
                    <span>View Analytics</span>
                  </Link>
                </div>

                {/* Generate Results */}
                <div className="border-b h-12 flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2">
                    <Printer size={16} />
                    <span>Generate Results</span>
                  </div>

                  <div className="flex items-center gap-x-5">
                    <button
                      type="button"
                      onClick={() => {
                        setResultsFilter(EMPTY_EXPORT_FILTER);
                        setResultsFormat("pdf");
                      }}
                      className="h-full border-r pr-5 flex items-center gap-1 cursor-pointer text-theme-warning"
                    >
                      {loading === "generateResults-pdf" ? (
                        <Spinner className="size-4" />
                      ) : (
                        <FileText size={14} />
                      )}
                      <span>*pdf</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResultsFilter(EMPTY_EXPORT_FILTER);
                        setResultsFormat("csv");
                      }}
                      className="flex items-center gap-1 cursor-pointer text-theme-success text-sm"
                    >
                      {loading === "generateResults-csv" ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Sheet size={14} />
                      )}
                      <span>*xlsx</span>
                    </button>
                  </div>
                </div>

                <Spacer size="sm" />
              </div>
            </div>
          </div>

          {/* Dialog - Assign Invigilator */}
          <Dialog
            open={showInvigilatorDialog}
            onOpenChange={setShowInvigilatorDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invigilators</DialogTitle>
                <DialogDescription>
                  Manage invigilators assigned to this assessment.
                </DialogDescription>
              </DialogHeader>

              {/* Assigned invigilators */}
              <div className="text-sm text-theme-gray mb-1">Assigned</div>
              {pageData?.invigilators?.length ? (
                <div className="flex flex-col gap-2">
                  {pageData.invigilators.map((adminId) => {
                    const admin = admins?.find((a) => a._id === adminId);
                    return (
                      <div
                        key={adminId}
                        className="flex items-center justify-between h-10 px-3 border rounded-md text-sm"
                      >
                        <span>{admin ? admin.fullName : adminId}</span>
                        <button
                          className="text-theme-gray hover:text-red-500 cursor-pointer"
                          onClick={() => removeInvigilator(adminId)}
                        >
                          {loading === `removeInvigilator-${adminId}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-theme-gray">
                  No invigilators assigned.
                </div>
              )}

              <Spacer size="sm" />

              {/* Add new invigilator */}
              <div className="text-sm text-theme-gray mb-1">
                Add Invigilator
              </div>
              <Select
                onValueChange={setSelectedAdminId}
                value={selectedAdminId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      admins === null ? "Loading admins..." : "Select an admin"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {admins
                    ?.filter((a) => !pageData?.invigilators?.includes(a._id))
                    .map((admin) => (
                      <SelectItem key={admin._id} value={admin._id}>
                        {admin.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Spacer size="sm" />

              <Button
                title="Assign Invigilator"
                loading={loading === "assignInvigilator"}
                variant="fill"
                onClick={assignInvigilator}
              />
            </DialogContent>
          </Dialog>

          {/* Dialog - Bulk Assign Students */}
          <Dialog
            open={showBulkAssignDialog}
            onOpenChange={(open) => {
              setShowBulkAssignDialog(open);
              if (!open) setBulkAssignFile(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Assign Students</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx) with student registration numbers
                  to bulk assign carryover or borrowed-course students.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <div
                className={`w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  bulkAssignFile
                    ? "border-accent bg-accent/5"
                    : "border-theme-gray-light hover:border-accent/50"
                }`}
                onClick={() =>
                  document.getElementById("bulk-assign-file-input")?.click()
                }
              >
                <input
                  id="bulk-assign-file-input"
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) =>
                    setBulkAssignFile(e.target.files?.[0] ?? null)
                  }
                />
                {bulkAssignFile ? (
                  <>
                    <div className="text-sm font-medium text-accent">
                      {bulkAssignFile.name}
                    </div>
                    <div className="text-xs text-theme-gray">
                      Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-theme-gray">
                      Click to select an .xlsx file
                    </div>
                    <div className="text-xs text-theme-gray">
                      Only .xlsx files are accepted
                    </div>
                  </>
                )}
              </div>

              <Spacer size="sm" />

              <Button
                title="Upload & Assign"
                loading={loading === "bulkAssignStudents"}
                variant="fill"
                onClick={bulkAssignStudents}
              />

              <div className="flex justify-center">
                <button
                  type="button"
                  className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading === "downloadAssignTemplate"}
                  onClick={downloadAssignTemplate}
                >
                  {loading === "downloadAssignTemplate"
                    ? "Downloading..."
                    : "Download template"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog - Bulk Unassign Students */}
          <Dialog
            open={showBulkUnassignDialog}
            onOpenChange={(open) => {
              setShowBulkUnassignDialog(open);
              if (!open) setBulkUnassignFile(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Unassign Students</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx) with student registration numbers
                  to bulk unassign students from this assessment.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <div
                className={`w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  bulkUnassignFile
                    ? "border-accent bg-accent/5"
                    : "border-theme-gray-light hover:border-accent/50"
                }`}
                onClick={() =>
                  document.getElementById("bulk-unassign-file-input")?.click()
                }
              >
                <input
                  id="bulk-unassign-file-input"
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) =>
                    setBulkUnassignFile(e.target.files?.[0] ?? null)
                  }
                />
                {bulkUnassignFile ? (
                  <>
                    <div className="text-sm font-medium text-accent">
                      {bulkUnassignFile.name}
                    </div>
                    <div className="text-xs text-theme-gray">
                      Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-theme-gray">
                      Click to select an .xlsx file
                    </div>
                    <div className="text-xs text-theme-gray">
                      Only .xlsx files are accepted
                    </div>
                  </>
                )}
              </div>

              <Spacer size="sm" />

              <Button
                title="Upload & Unassign"
                loading={loading === "bulkUnassignStudents"}
                variant="fill"
                onClick={bulkUnassignStudents}
              />

              <div className="flex justify-center">
                <button
                  type="button"
                  className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading === "downloadUnassignTemplate"}
                  onClick={downloadUnassignTemplate}
                >
                  {loading === "downloadUnassignTemplate"
                    ? "Downloading..."
                    : "Download template"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog - Export Submissions */}
          <Dialog
            open={showExportEntriesDialog}
            onOpenChange={setShowExportEntriesDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Submissions</DialogTitle>
                <DialogDescription>
                  Narrow the scripts down before downloading. Leave a filter on
                  "All" to include every student.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <ExportFilters
                filter={entriesFilter}
                setFilter={setEntriesFilter}
                groups={groups}
              />
              <Spacer size="md" />

              <Button
                type="button"
                title="Download Scripts"
                loading={loading === "generateAssEntries"}
                variant="fill"
                icon={<Database size={18} />}
                onClick={generateAssEntries}
              />

              <div className="flex justify-center">
                <button
                  type="button"
                  className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
                  onClick={() => setEntriesFilter(EMPTY_EXPORT_FILTER)}
                >
                  Clear filters
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog - Export Results */}
          <Dialog
            open={!!resultsFormat}
            onOpenChange={(open) => !open && setResultsFormat(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Generate Results ({resultsFormat === "pdf" ? "PDF" : "Excel"})
                </DialogTitle>
                <DialogDescription>
                  Narrow the results down before downloading. Leave a filter on
                  "All" to include every student.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <ExportFilters
                filter={resultsFilter}
                setFilter={setResultsFilter}
                groups={groups}
              />
              <Spacer size="md" />

              <Button
                type="button"
                title={
                  resultsFormat === "pdf" ? "Download PDF" : "Download Excel"
                }
                loading={loading === `generateResults-${resultsFormat}`}
                variant="fill"
                icon={
                  resultsFormat === "pdf" ? (
                    <FileText size={18} />
                  ) : (
                    <Sheet size={18} />
                  )
                }
                onClick={() =>
                  resultsFormat && generateAssResults(resultsFormat)
                }
              />

              <div className="flex justify-center">
                <button
                  type="button"
                  className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
                  onClick={() => setResultsFilter(EMPTY_EXPORT_FILTER)}
                >
                  Clear filters
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog - Result Breakdown */}
          <Dialog
            open={!!breakdown}
            onOpenChange={(open) => !open && setBreakdown(null)}
          >
            <DialogContent className="sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Result Breakdown</DialogTitle>
                <DialogDescription>
                  {breakdown?.assessment.title} — {breakdown?.results.length}{" "}
                  submitted{" "}
                  {breakdown?.results.length === 1 ? "student" : "students"},{" "}
                  {breakdown?.assessment.totalQuestions} questions,{" "}
                  {breakdown?.assessment.totalPossibleScore} marks obtainable.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              {breakdown?.results.length ? (
                <div className="max-h-[60vh] overflow-auto rounded-xs border border-theme-gray-mid">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-accent-light text-accent">
                      <tr className="h-10 font-medium">
                        <th className="px-2 whitespace-nowrap">S/N</th>
                        <th className="px-2 whitespace-nowrap">Student</th>
                        <th className="px-2 whitespace-nowrap">Level</th>
                        <th className="px-2 whitespace-nowrap">Objective</th>
                        <th className="px-2 whitespace-nowrap">Subjective</th>
                        <th className="px-2 whitespace-nowrap">Theory</th>
                        {sectionTitles.map((title) => (
                          <th className="px-2 whitespace-nowrap" key={title}>
                            {title}
                          </th>
                        ))}
                        <th className="px-2 whitespace-nowrap">Total</th>
                        <th className="px-2 whitespace-nowrap">%</th>
                      </tr>
                    </thead>

                    <tbody className="text-theme-gray">
                      {breakdown.results.map((item) => (
                        <tr
                          className="h-12 border-b border-theme-gray-mid last:border-b-0 hover:bg-theme-gray-light/20"
                          key={item.student.id}
                        >
                          <td className="px-2">{item.sn}</td>
                          <td className="px-2 whitespace-nowrap">
                            <div>{item.student.fullName}</div>
                            <div className="text-xs">{item.student.regNo}</div>
                          </td>
                          <td className="px-2">{item.student.level || "-"}</td>
                          <td className="px-2">{item.scores.objective}</td>
                          <td className="px-2">{item.scores.subjective}</td>
                          <td className="px-2">{item.scores.theory}</td>
                          {sectionTitles.map((title) => {
                            const section = item.sectionScores?.find(
                              (sec) => sec.title === title,
                            );

                            return (
                              <td
                                className="px-2 whitespace-nowrap"
                                key={title}
                              >
                                {section
                                  ? `${section.score} / ${section.maxScore}`
                                  : "-"}
                              </td>
                            );
                          })}
                          <td className="px-2">
                            {item.scores.total} /{" "}
                            {breakdown.assessment.totalPossibleScore}
                          </td>
                          <td
                            className={`px-2 ${
                              item.percentage >= 50
                                ? "text-theme-success"
                                : "text-theme-error"
                            }`}
                          >
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-sm text-theme-gray">
                  No submitted results for this assessment yet.
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Spacer */}
          <Spacer size="xl" />
          <Spacer size="xl" />
        </>
      )}

      <Preload
        loading={loading}
        pageData={pageData ? true : false}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export const PageWrapper = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);

  return (
    <SessionProvider>
      <Page id={id} />
    </SessionProvider>
  );
};

export default PageWrapper;
