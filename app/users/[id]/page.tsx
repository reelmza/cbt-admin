"use client";

import Spacer from "@/components/spacer";

import { attachHeaders, getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleQuestionMark,
  KeyRound,
  Pencil,
  Trash2,
  User2,
  X,
} from "lucide-react";
import { StudentProfile } from "./id.types";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/button";
import Preload from "@/components/preload";
import Input from "@/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { toastConfig } from "@/utils/toastConfig";

const Page = ({ id }: { id: string }) => {
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | boolean>(
    false,
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  const removeAss = async (assId: string) => {
    const globalController = new AbortController();
    setLoading("removeAss");
    try {
      const api = await getAxios();
      attachHeaders(session!.user.token);

      // Get students assessments
      const res = await api.post(`/assessment/unassign/${assId}`, {
        signal: globalController.signal,
      });

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) => {
          const newData = prev?.filter((ex) => ex._id !== assId);

          if (newData && newData?.length > 0) {
            return [...newData];
          }

          return [];
        });

        setShowConfirmDialog(false);
      }

      setLoading(null);
    } catch (error: any) {
      console.log(error);
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }

      setLoading(null);
    }
  };

  const removeSub = async (assId: string) => {
    const globalController = new AbortController();
    setLoading("removeSub");
    try {
      const api = await getAxios();
      attachHeaders(session!.user.token);

      // Get students assessments
      const res = await api.post(
        `/assessment/remove-submission/${assId}`,
        {
          signal: globalController.signal,
        },
      );

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) => {
          if (!prev) return prev;

          let newData = [...prev];
          let target = newData.find((item) => item._id == assId);

          if (target) {
            target.status = "pending";
          }

          return [...newData];
        });

        setShowConfirmDialog(false);
      }

      setLoading(null);
    } catch (error: any) {
      console.log(error);
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }

      setLoading(null);
    }
  };

  const resetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      password: { value: string };
    };

    setLoading("resetPassword");
    try {
      const api = await getAxios();
      attachHeaders(session!.user.token);
      const res = await api.patch(
        `/student/reset-password/${encodeURIComponent(profile?.regNumber ?? "")}`,
        { password: target.password.value },
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Password reset successfully.", toastConfig);
        setShowResetPasswordDialog(false);
      }

      setLoading(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to reset password.",
        toastConfig,
      );
      setLoading(null);
    }
  };

  const updateStudent = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      fullName: { value: string };
      email: { value: string };
      phoneNumber: { value: string };
      level: { value: string };
      gender: { value: string };
      accessCode: { value: string };
    };

    setLoading("update");
    try {
      const api = await getAxios();
      attachHeaders(session!.user.token);

      const res = await api.patch(`/student/update/${id}`, {
        fullName: target.fullName.value,
        email: target.email.value,
        phoneNumber: target.phoneNumber.value,
        level: Number(target.level.value),
        gender: target.gender.value,
        accessCode: target.accessCode.value,
      });

      if (res.status === 200 || res.status === 201) {
        setProfile((prev) => (prev ? { ...prev, ...res.data.data } : prev));
        setShowEditDialog(false);
        toast.success("Student details updated.");
      }

      setLoading(null);
    } catch (error: any) {
      console.log(error);
      toast.error("Failed to update student details.", toastConfig);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      try {
        const api = await getAxios();
        attachHeaders(session!.user.token);

        // Get profile
        const studentRes = await api.get(`/student/profile/${id}`, {
          signal: controller.signal,
        });

        // Get students assessments
        const assRes = await api.get(`/assessment/student/${id}`, {
          signal: controller.signal,
        });

        if (assRes.status === 200 && studentRes.status === 200) {
          setProfile(studentRes.data.data);
          setPageData(assRes.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          {/* Top: Profile Card + Info Grid */}
          <div className="flex gap-6 items-start">
            {/* Left: Avatar card */}
            <div className="shrink-0 w-52 flex flex-col items-center gap-4 border rounded-xl p-5">
              <div className="w-36 h-36 rounded-xl overflow-hidden border bg-theme-gray-light flex items-center justify-center">
                {profile?.passportPhoto ? (
                  <img
                    src={profile.passportPhoto}
                    alt="Passport"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User2
                    size={72}
                    strokeWidth={0.3}
                    className="text-theme-gray-mid"
                  />
                )}
              </div>

              <div className="text-center">
                <div className="font-semibold text-sm leading-snug">
                  {profile?.fullName}
                </div>
                <div className="text-xs text-theme-gray mt-0.5">
                  {profile?.regNumber}
                </div>
                <div className="mt-2 inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-sm">
                  {profile?.level}L
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-1.5 text-xs text-theme-gray hover:text-accent border border-border rounded-md h-8 cursor-pointer transition-colors"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil size={13} />
                Edit Profile
              </button>

              <button
                className="w-full flex items-center justify-center gap-1.5 text-xs text-theme-gray hover:text-accent border border-border rounded-md h-8 cursor-pointer transition-colors"
                onClick={() => setShowResetPasswordDialog(true)}
              >
                <KeyRound size={13} />
                Reset Password
              </button>
            </div>

            {/* Right: Info grid */}
            <div className="grow border rounded-xl p-5">
              <div className="text-sm font-semibold mb-4">
                Student Information
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Email", value: profile?.email || "—" },
                  { label: "Phone Number", value: profile?.phoneNumber || "—" },
                  { label: "NIN", value: profile?.nin || "—" },
                  { label: "Access Code", value: profile?.accessCode || "—" },
                  { label: "Role", value: profile?.role || "—" },
                  {
                    label: "Last Sync",
                    value: profile?.lastSync
                      ? prettyDate(profile.lastSync.split("T")[0])
                      : "—",
                  },
                  {
                    label: "Device Bound",
                    value: profile?.deviceId ? "Yes" : "No",
                  },
                  { label: "IP Address", value: profile?.ipAddress || "—" },
                  {
                    label: "Enrolled",
                    value: profile?.createdAt
                      ? prettyDate(profile.createdAt.split("T")[0])
                      : "—",
                  },
                ].map((field) => (
                  <div key={field.label} className="flex flex-col gap-1">
                    <div className="text-xs text-theme-gray">{field.label}</div>
                    <div className="text-sm font-medium truncate">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Spacer size="lg" />

          {/* Assigned Exams */}
          <div className="border rounded-xl p-5">
            <div className="text-sm font-semibold mb-4">Assigned Exams</div>
            {pageData.length === 0 ? (
              <div className="text-sm text-theme-gray">No exams assigned.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {pageData.map((ex, key: number) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-theme-gray-light/20"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {ex.course.code}
                        <span className="text-theme-gray font-normal ml-2">
                          {ex.course.title}
                        </span>
                      </div>
                      <div className="text-xs text-theme-gray mt-0.5">
                        Due: {ex.dueDate.split("T")[0]}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                          ex.status === "submitted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-theme-gray-light text-theme-gray"
                        }`}
                      >
                        {ex.status}
                      </span>

                      {ex.status === "submitted" && (
                        <button
                          className="flex items-center gap-1 text-xs text-theme-gray hover:text-red-500 cursor-pointer"
                          onClick={() => setShowConfirmDialog(`sub-${ex._id}`)}
                        >
                          <Trash2 size={13} />
                          Remove Submission
                        </button>
                      )}

                      <button
                        className="flex items-center gap-1 text-xs text-theme-gray hover:text-red-500 cursor-pointer"
                        onClick={() => setShowConfirmDialog(`ass-${ex._id}`)}
                      >
                        <Trash2 size={13} />
                        Unassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Spacer size="xl" />

          {/* Dialog - Edit Student Details */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Student Details</DialogTitle>
                <DialogDescription>
                  Update the student's profile information.
                </DialogDescription>
              </DialogHeader>

              <form className="flex flex-col gap-3" onSubmit={updateStudent}>
                <Input
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  defaultValue={profile?.fullName}
                  required
                />

                <Input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  defaultValue={profile?.email}
                />
                <Input
                  name="phoneNumber"
                  type="text"
                  placeholder="Phone Number"
                  defaultValue={profile?.phoneNumber}
                />
                <Input
                  name="level"
                  type="number"
                  placeholder="Level"
                  defaultValue={String(profile?.level ?? "")}
                />
                <Select name="gender" defaultValue={profile?.gender}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="accessCode"
                  type="text"
                  placeholder="Access Code"
                  defaultValue={profile?.accessCode}
                />
                <Spacer size="sm" />
                <Button
                  title="Save Changes"
                  loading={loading === "update"}
                  variant="fill"
                  icon={<ArrowRight size={16} />}
                />
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog - Reset Password */}
          <Dialog
            open={showResetPasswordDialog}
            onOpenChange={setShowResetPasswordDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set a new password for {profile?.fullName}.
                </DialogDescription>
              </DialogHeader>

              <form className="flex flex-col gap-3" onSubmit={resetPassword}>
                <Input
                  name="password"
                  type="password"
                  placeholder="New Password"
                  required
                />
                <Spacer size="sm" />
                <Button
                  title="Reset Password"
                  loading={loading === "resetPassword"}
                  variant="fill"
                  icon={<KeyRound size={16} />}
                />
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog - Remove Assessment */}
          <Dialog
            open={typeof showConfirmDialog === "string"}
            onOpenChange={setShowConfirmDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="hidden">End Exam</DialogTitle>
                <DialogDescription className="hidden">
                  you are about to end exams
                </DialogDescription>
              </DialogHeader>

              <div className="w-full flex flex-col items-center mt-10">
                <CircleQuestionMark size={82} className="text-black/80" />

                {/* Prompt Text */}
                <div className="text-3xl text-black/80 font-semibold">
                  Are you sure?
                </div>
                <Spacer size="xl" />

                {/* Buttons */}
                <div className="flex items-center gap-4">
                  <div className="w-38">
                    <Button
                      title={"No, Go back"}
                      loading={false}
                      variant={"outline"}
                      onClick={() => setShowConfirmDialog(false)}
                    />
                  </div>

                  <div className="w-38">
                    <Button
                      title={"Yes, Delete"}
                      loading={loading == "removeAss" || loading == "removeSub"}
                      variant={"fillError"}
                      icon={<ArrowRight size={14} />}
                      onClick={() => {
                        if (typeof showConfirmDialog !== "string") return;
                        let action = showConfirmDialog.split("-")[0];

                        if (action === "ass") {
                          removeAss(showConfirmDialog.split("-")[1]);
                        }

                        if (action === "sub") {
                          removeSub(showConfirmDialog.split("-")[1]);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
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
