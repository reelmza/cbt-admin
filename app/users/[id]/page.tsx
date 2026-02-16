"use client";

import Spacer from "@/components/spacer";

import { attachHeaders, localAxios } from "@/lib/axios";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
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

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | boolean>(
    false
  );

  useEffect(() => {
    if (!session) return;

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
        if (error.name !== "CanceledError") {
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
      {!loading && pageData && (
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

              {/* Courses Offered */}
              <div className="w-6/10">
                <div className="font-semibold">Assigned Exams</div>
                <Spacer size="sm" />
                {pageData.map((ex, key: number) => {
                  return (
                    <div
                      key={key}
                      className="w-full border rounded-md overflow-hidden"
                    >
                      <div className="w-full pt-2 flex items-center px-2 rounded justify-between">
                        <div>
                          {ex.course.code} : {ex.course.title}
                        </div>
                        <button
                          className="flex items-center justify-center cursor-pointer  hover:text-red-600"
                          onClick={() => setShowConfirmDialog("ass")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="px-2 text-sm mb-2 text-theme-gray">
                        Due: {ex.dueDate.split("T")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Spacer size="md" />

              {/* Submissions */}
              <div className="w-6/10">
                <div className="font-semibold">Submissions</div>
                <Spacer size="sm" />
                {pageData.map((ex, key: number) => {
                  return (
                    <div
                      key={key}
                      className="border w-full h-10 flex items-center pl-2 rounded justify-between overflow-hidden"
                    >
                      <div>
                        {ex.course.code} : {ex.course.title}
                      </div>
                      <button
                        className="h-10 w-10 flex items-center justify-center cursor-pointer  hover:text-red-600"
                        onClick={() => setShowConfirmDialog("sub")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Spacer size="xl" />

          {/* Dialog - End Exam */}
          <Dialog
            open={showConfirmDialog == "ass" || showConfirmDialog == "sub"}
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
                      loading={loading === "submitAss"}
                      variant={"outline"}
                      onClick={() => setShowConfirmDialog(false)}
                    />
                  </div>

                  <div className="w-38">
                    <Button
                      title={"Yes, Delete"}
                      loading={loading == "submitTest"}
                      variant={"fillError"}
                      icon={<ArrowRight size={14} />}
                      // onClick={submitTest}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Page Loading */}
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
