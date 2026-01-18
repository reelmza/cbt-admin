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

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<PageDataType | null>(null);

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(`/school/assessment/${id}`, {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res.data.data);
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
                  className="col-span-3 p-5 shadow rounded-lg border flex flex-col gap-5"
                >
                  <div className="text-theme-gray text-sm">{card.title}</div>

                  <div className="flex flex-col justify-end h-10">
                    {/* Badge Values */}
                    {card.title === "Status" && (
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
                    {card.title !== "Status" && (
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
            <div className="col-span-6 shadow border rounded-md p-5">
              {/* Test Status */}
              <div className="text-sm text-theme-gray">Test Status</div>
              <Spacer size="sm" />

              <form className="flex items-center gap-4">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </form>
              <Spacer size="md" />

              {/* Test Duration */}
              <div className="text-sm text-theme-gray">Test Duration</div>
              <Spacer size="sm" />

              <form className="flex items-center gap-4">
                <Input
                  name="duration"
                  type="number"
                  placeholder="Enter duration in minutes"
                />

                <div className="w-38 shrink-0">
                  <Button
                    type="button"
                    title="Save"
                    loading={false}
                    variant="outline"
                  />
                </div>
              </form>
              <Spacer size="md" />

              {/* Start/End Test */}
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Button
                    title="Start Test"
                    type="button"
                    variant="fill"
                    loading={false}
                  />
                </div>

                <div className="w-32">
                  <Button
                    title="End Test"
                    type="button"
                    variant="fillError"
                    loading={false}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-6 shadow border rounded-md p-5">
              {/* Assign to group */}
              <div className="text-sm text-theme-gray">Assign to group</div>
              <Spacer size="sm" />

              <form className="flex items-center gap-4">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physc">Physics</SelectItem>
                    <SelectItem value="architecture">Archi</SelectItem>
                  </SelectContent>
                </Select>
              </form>
              <Spacer size="md" />

              {/* Assign to students */}
              {/* Test Duration */}
              <div className="text-sm text-theme-gray">Asign to student</div>
              <Spacer size="sm" />

              <form className="flex items-center gap-4">
                <Input
                  name="regNumber"
                  type="text"
                  placeholder="Enter registration number"
                />

                <div className="w-38 shrink-0">
                  <Button
                    type="button"
                    title="Asign"
                    loading={false}
                    variant="outline"
                  />
                </div>
              </form>
              <Spacer size="md" />
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
