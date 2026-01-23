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
import { attachHeaders, localAxios } from "@/lib/axios";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { PageDataType } from "./id.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toastConfig } from "@/utils/toastConfig";

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<PageDataType | null>(null);
  const [groups, setGroups] = useState<GroupType[] | null>(null);

  // Update assessment status
  const updateStatus = async (val: string) => {
    if (!pageData) return;

    setLoading("updateStatus");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/admin/update-assessment/${id}`,
        { status: val },
        {
          signal: controller.signal,
        }
      );

      if (res.status === 201) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
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
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/admin/update-assessment/${id}`,
        { timeLimit: Number(target.duration.value) },
        {
          signal: controller.signal,
        }
      );

      if (res.status === 201) {
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
        toast.success(
          `Successfully assigned ${target.duration.value} mintues to test`,
          toastConfig
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

  // Update assessment start date
  const updateStartDate = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      startDate: { value: string };
    };

    setLoading("updateStartDate");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/admin/update-assessment/${id}`,
        { startDate: new Date(target.startDate.value).toISOString() },
        {
          signal: controller.signal,
        }
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
        setLoading("pageError");
        console.log(error);
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
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/admin/update-assessment/${id}`,
        { dueDate: new Date(target.dueDate.value).toISOString() },

        {
          signal: controller.signal,
        }
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
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Start assessment
  const authorizeAss = async () => {
    if (!pageData) return;

    setLoading("authorizeAss");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(`/assessment/authorize/${id}`, {
        signal: controller.signal,
      });

      if (res.status === 201) {
        console.log(res);
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // End assessment
  const endAssessment = async () => {
    if (!pageData) return;

    setLoading("endAssessment");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.patch(`/assessment/end/${id}`, {
        signal: controller.signal,
      });

      if (res.status === 201) {
        console.log(res);
        setPageData((prev) => {
          return { ...res.data.data, course: prev?.course };
        });
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Delete assessment
  const deleteAss = async () => {
    if (!pageData) return;

    setLoading("deleteAss");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.delete(`/assessment/delete/${id}`, {
        signal: controller.signal,
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

  // Assign to faculty
  const assignToFaculty = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      group: { value: string };
    };

    setLoading("assignToFaculty");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.post(
        `/assessment/assign/${id}`,
        { group: target.group.value },
        {
          signal: controller.signal,
        }
      );

      if (res.status === 200) {
        toast.success("Faculty added to assessment successfully", toastConfig);
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
      attachHeaders(session!.user.token);

      const studentRes = await localAxios.get(`/student/all`, {
        params: { searchByRegNumber: target.regNumber.value },
      });

      if (studentRes.status !== 200) throw new Error();
      const targetStudent = studentRes.data.data.data.find(
        (sd: any) => sd.regNumber === target.regNumber.value
      );
      if (!targetStudent) {
        toast.error("Student does not exist", toastConfig);
        throw new Error("Student does not exist");
      }

      const res = await localAxios.post(
        `/assessment/assign/${id}`,
        { students: [targetStudent._id] },
        {
          signal: controller.signal,
        }
      );

      if (res.status == 200) {
        toast.success(
          `${targetStudent.fullName} added to assessment successfully`,
          toastConfig
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

  // Generate assessement entries
  const generateAssEntries = async () => {
    setLoading("generateAssEntries");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.get(
        `/assessment/export-submission/${id}`,

        {
          responseType: "blob",
          signal: controller.signal,
        }
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
      }

      setLoading(null);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setLoading("pageError");
        console.log(error);
      }
    }
  };

  // Update assessment duration
  const generateAssResults = async () => {
    setLoading("generateAssResults");
    try {
      attachHeaders(session!.user.token);
      const res = await localAxios.get(
        `/assessment/export-result/${id}`,

        {
          responseType: "blob",
          signal: controller.signal,
        }
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
      }

      if (res.status === 400) {
        toast.error(
          "No results prepared for this assessment yet.",
          toastConfig
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

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(`/admin/assessment/${id}`, {
          signal: controller.signal,
        });

        // Get Groups
        const groupRes = await localAxios.get("/admin/groups", {
          signal: controller.signal,
        });

        if (res.status === 201 && groupRes.status === 201) {
          setGroups(groupRes.data.data);
          setPageData(res.data.data);
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
      {pageData && (
        <div className="w-full min-h-full">
          {/* Title */}
          <div>
            <div className="text-2xl font-semibold">{pageData.course.code}</div>
            <div className="text-theme-gray">{pageData.course.title}</div>
          </div>
          <Spacer size="md" />

          {/* Cards */}
          <div className="grid grid-cols-12 gap-4">
            {[
              { title: "Vissibility", value: pageData.status },

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
                  className="col-span-3 p-5 shadow rounded-lg border flex flex-col gap-5"
                >
                  <div className="text-theme-gray text-sm">{card.title}</div>

                  <div className="flex flex-col justify-end h-10">
                    {/* Badge Values */}
                    {card.title === "Vissibility" && (
                      <div
                        className={`w-fit text-xs px-2 py-0.5 rounded-sm mb-1 ${
                          card.value == "published"
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

          {/* Controls */}
          <div className="grid grid-cols-12 gap-4">
            {/* Assessment Settings */}
            <div className="col-span-6 shadow border rounded-md p-5">
              {/* Test Vissibility */}
              <div className="text-sm text-theme-gray">Test Vissibility</div>
              <Spacer size="sm" />

              <div className="flex items-center gap-4">
                <Select
                  defaultValue={pageData.status}
                  onValueChange={updateStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Spacer size="md" />

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

                <div className="w-38 shrink-0">
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

              <div className="flex items-center gap-2">
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
                {!pageData.endReason && (
                  <div className="shrink-0 w-38">
                    <Button
                      title={
                        pageData.authorizedToStart ? "Pause Exam" : "Start Exam"
                      }
                      type="button"
                      variant="fill"
                      loading={loading === "authorizeAss"}
                      onClick={authorizeAss}
                    />
                  </div>
                )}

                {/* Exam ongoing, not ended */}
                {pageData.authorizedToStart && !pageData.endReason && (
                  <div className="shrink-0 w-38">
                    <Button
                      title="End Test"
                      type="button"
                      variant="fillError"
                      loading={false}
                      onClick={endAssessment}
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

                <div className="w-38 shrink-0">
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

                <div className="w-38 shrink-0">
                  <Button
                    type="submit"
                    title="Save"
                    loading={loading === "updateDueDate"}
                    variant="outline"
                  />
                </div>
              </form>

              <Spacer size="xl" />

              {/* Delete assessment */}
              <div className="w-48">
                <Button
                  title={"Delete Assessment"}
                  loading={loading === "deleteAss"}
                  variant={"fillError"}
                  onClick={deleteAss}
                />
              </div>
            </div>

            {/* Assessement Assignment */}
            <div className="col-span-6 shadow border rounded-md p-5">
              {/* Assign to group */}
              <div className="text-sm text-theme-gray">Assign to faculty</div>
              <Spacer size="sm" />

              <form
                className="flex items-center gap-4"
                onSubmit={assignToFaculty}
              >
                <Select
                  name="group"
                  onValueChange={(val) => {
                    if (!groups) return;
                    const target = groups.find((grp) => grp._id == val);
                    // target && setSelectedGroup(target);
                  }}
                  required
                >
                  <SelectTrigger className="w-full grow">
                    <SelectValue
                      placeholder={
                        groups && groups?.length < 1
                          ? "No faculty created"
                          : "Choose faculty"
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

                <div className="w-38 shrink-0">
                  <Button
                    type="submit"
                    title="Assign"
                    loading={loading === "assignToFaculty"}
                    variant="outline"
                  />
                </div>
              </form>
              <Spacer size="md" />

              {/* Assign to students */}
              {/* Test Duration */}
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
              <Spacer size="md" />

              {/* Generate entries */}
              <div className="text-sm text-theme-gray">
                Generate Attempts List
              </div>
              <Spacer size="sm" />

              <div className="flex items-center-safe gap-4">
                {/* Generate Entries */}
                <div className="w-42">
                  <Button
                    type="button"
                    title={"Generate Entries"}
                    loading={loading == "generateAssEntries"}
                    variant={"fill"}
                    onClick={() => generateAssEntries()}
                  />
                </div>

                {/* Generate Result */}
                <div className="w-42">
                  <Button
                    type="button"
                    title={"Generate Results"}
                    loading={loading == "generateAssResults"}
                    variant={"fill"}
                    onClick={() => generateAssResults()}
                  />
                </div>
              </div>

              <Spacer size="sm" />
            </div>
          </div>
        </div>
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
