"use client";

import Spacer from "@/components/spacer";

import { attachHeaders, localAxios } from "@/lib/axios";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleQuestionMark, Trash2, User2, X } from "lucide-react";
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

const Page = ({ id }: { id: string }) => {
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | boolean>(
    false
  );

  const removeAss = async (assId: string) => {
    setLoading("removeAss");
    try {
      attachHeaders(session!.user.token);

      // Get students assessments
      const res = await localAxios.post(`/assessment/unassign/${assId}`, {
        signal: controller.signal,
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
    setLoading("removeSub");
    try {
      attachHeaders(session!.user.token);

      // Get students assessments
      const res = await localAxios.post(
        `/assessment/remove-submission/${assId}`,
        {
          signal: controller.signal,
        }
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

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);

        // Get profile
        const studentRes = await localAxios.get(`/student/profile/${id}`, {
          signal: controller.signal,
        });

        // Get students assessments
        const assRes = await localAxios.get(`/assessment/student/${id}`, {
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
          <div className="w-full flex gap-10 min-h-full">
            {/* Pofile Picture */}
            <div className="border rounded-full h-[220px] w-[220px] flex items-center justify-center">
              <User2
                size={140}
                strokeWidth={0.2}
                className="text-theme-gray-mid"
              />
            </div>

            {/* User Profile & Courses*/}
            <div className="grow">
              <div>
                {/* Full Name */}
                <div className="font-semibold">Full Name</div>
                <div className="text-2xl font-bold">{profile?.fullName}</div>
                <Spacer size="sm" />

                {/* Reg Number */}
                <div className="">Reg Number: {profile?.regNumber}</div>
                <div className="">Level: {profile?.level}</div>
                <div className="">NIN: {profile?.nin}</div>
              </div>
              <Spacer size="xl" />

              {/* Assigned Exams */}
              <div className="w-6/10">
                <div className="font-semibold">Assigned Exams</div>
                <Spacer size="sm" />
                {pageData.map((ex, key: number) => {
                  return (
                    <div
                      key={key}
                      className="w-full border rounded-md overflow-hidden mb-2 p-2"
                    >
                      {/* Title */}
                      <div className="w-full rounded justify-between">
                        {ex.course.code} : {ex.course.title}
                      </div>

                      {/* Due Date */}
                      <div className="text-sm mb-2 text-theme-gray">
                        Due: {ex.dueDate.split("T")[0]}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-x-4">
                        {ex.status === "submitted" && (
                          <button
                            className="flex items-center justify-center cursor-pointer hover:text-red-600 text-sm gap-1"
                            onClick={() =>
                              setShowConfirmDialog(`sub-${ex._id}`)
                            }
                          >
                            {loading !== ex._id &&
                            ex._id.split("-")[0] !== "sub" ? (
                              <Trash2 size={14} />
                            ) : (
                              <Spinner className="h-4" />
                            )}
                            Delete Submission
                          </button>
                        )}

                        <button
                          className="flex items-center justify-center cursor-pointer hover:text-red-600 text-sm gap-1"
                          onClick={() => setShowConfirmDialog(`ass-${ex._id}`)}
                        >
                          {loading !== ex._id ? (
                            <Trash2 size={14} />
                          ) : (
                            <Spinner className="h-4" />
                          )}
                          Delete Assessment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Spacer size="md" />
            </div>
          </div>

          <Spacer size="xl" />

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
