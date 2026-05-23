"use client";

import Preload from "@/components/preload";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { SubmissionDetailResponse } from "@/types";
import { Check, Stars, X } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { toastConfig } from "@/utils/toastConfig";
import Button from "@/components/button";

// ─── Main Page ───────────────────────────────────────────────────────────────
const Page = ({ id, studentId }: { id: string; studentId: string }) => {
  const { data: session } = useSession();

  // ─── State ─────────────────────────────────────────────────────────────────
  // loading uses a string key to track per-question spinner state
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<SubmissionDetailResponse | null>(
    null,
  );

  // ─── Mark Question ─────────────────────────────────────────────────────────
  // action: "pass" assigns the given score; "fail" sends score 0
  const markQuestion = async (
    questionId: string,
    score: number,
    action: string,
  ) => {
    const controller = new AbortController();
    try {
      action === "pass"
        ? setLoading(`pass-markQuestion-${questionId}`)
        : setLoading(`fail-markQuestion-${questionId}`);

      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/assessment/mark-question/${pageData?.submissionId}/${questionId}`,
        { score: score, type: "pass" },
        {
          signal: controller.signal,
        },
      );

      if (res.status == 200) {
        const updatedAnswer = (res.data.data.answers as any[]).find(
          (a) => a.question._id === questionId,
        );

        if (updatedAnswer && pageData) {
          setPageData({
            ...pageData,
            answers: pageData.answers.map((ans) =>
              ans.question.id === questionId
                ? {
                    ...ans,
                    score: updatedAnswer.score,
                    status: updatedAnswer.status,
                    markedBy: updatedAnswer.markedBy,
                    isManuallyMarked: updatedAnswer.isManuallyMarked,
                  }
                : ans,
            ),
          });

          toast.success("Question marked successfully", toastConfig);
        }
      }

      setLoading(null);
    } catch (error) {
      setLoading(null);
      console.log(error);
    }
  };

  // ─── AI Mark ───────────────────────────────────────────────────────────────
  const aiMark = async () => {
    try {
      setLoading("aiMark");
      attachHeaders(session!.user.token);
      await localAxios.post(`/assessment/ai-mark/${id}/${studentId}`);
      toast.success("AI marking completed successfully", toastConfig);
      setLoading(null);
    } catch (error: any) {
      setLoading(null);
      toast.error(
        error?.response?.data?.message ?? "Failed to run AI marking.",
        toastConfig,
      );
    }
  };

  // ─── Finalize Marking ──────────────────────────────────────────────────────
  const finalizeMarking = async () => {
    const controller = new AbortController();
    try {
      setLoading("finalizeMarking");

      attachHeaders(session!.user.token);
      const res = await localAxios.patch(
        `/assessment/finalize-marking/${pageData?.submissionId}`,
        {},
        { signal: controller.signal },
      );

      if (res.status == 200) {
        toast.success("Marking finalized successfully", toastConfig);
      }

      setLoading(null);
    } catch (error) {
      setLoading(null);
      console.log(error);
    }
  };

  // ─── Fetch Submission ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get(
          `/assessment/submissions/${id}/${studentId}`,
          {
            signal: controller.signal,
          },
        );

        if (res.status == 200) {
          console.log(res.data.data);
          setPageData(res.data.data);
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full min-h-full p-10 font-sans">
      {pageData && (
        <>
          {/* Sticky header — student info */}
          <div className="flex items-center justify-between fixed top-0 pt-10 pb-5 right-0 w-8/10 bg-white px-8">
            <div className="flex flex-col justify-end">
              <div className="leading-none text-xl font-bold">
                Mark Assessment
              </div>
              <div className="text-sm">
                {pageData?.student?.fullName}
                {` (${pageData?.student?.regNo})`}
              </div>
              <div className="text-sm">{`Submitted on ${
                pageData?.submittedAt ? prettyDate(pageData?.submittedAt) : ""
              }`}</div>
            </div>
            <div className="w-36">
              <Button
                title="AI Mark"
                variant="fill"
                loading={loading === "aiMark"}
                icon={<Stars size={14} />}
                onClick={aiMark}
                type="button"
              />
            </div>
          </div>

          {/* Answer list — only pending (unmarked) answers */}
          <div className="pt-20 pb-10">
            {pageData?.answers.map((ans, key) => {
              return (
                <div key={key} className="w-full flex gap-10">
                  {/* Left — question + student answer + expected answer */}
                  <div className="w-7/12 shrink-0 border p-5 mb-5">
                    {/* Heading */}
                    <div className="flex justify-between items-center mb-5">
                      <div className="text-theme-gray mb-1 text-sm">
                        Question
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Question Type */}
                        <div className="text-xs text-theme-gray border px-2">
                          {ans?.question?.type === "subjective"
                            ? "subjective"
                            : ans.question.type === "multiple_choice"
                              ? "multiple choice"
                              : ans.question.type === "theory"
                                ? "theory"
                                : ans.question.type}
                        </div>
                        {/* Marked Status for non auto marked*/}
                        {ans.status !== "auto-marked" && (
                          <div
                            className={`text-xs border px-2 ${
                              ans.markedBy && ans.score > 0
                                ? "text-theme-success bg-emerald-50 border-emerald-200"
                                : ans.markedBy && ans.score < 1
                                  ? "text-theme-warning bg-red-50 border-red-200"
                                  : "text-theme-gray bg-gray-100 border-gray-200"
                            }`}
                          >
                            {ans.score > 0 && ans.markedBy
                              ? "Correct"
                              : ans.score < 1 && ans.markedBy
                                ? "Wrong"
                                : "Not Marked"}
                          </div>
                        )}

                        {ans.status == "auto-marked" && (
                          <div
                            className={`text-xs border px-2 text-theme-success bg-emerald-50 border-emerald-200 ${ans.score > 0 ? "text-theme-success bg-emerald-50 border-emerald-200" : "text-theme-warning bg-red-50 border-red-200"}
                          `}
                          >
                            auto-marked
                          </div>
                        )}

                        {ans.status == "auto-marked" && (
                          <div
                            className={`text-xs border px-2 text-theme-success bg-emerald-50 border-emerald-200 ${ans.score > 0 ? "text-theme-success bg-emerald-50 border-emerald-200" : "text-theme-warning bg-red-50 border-red-200"}
                          `}
                          >
                            {ans.score > 0 ? "Corect" : "Wrong"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="mb-2">{ans?.question?.text}</div>

                    {/* _________________________________________________ */}
                    {/* Students Answer */}
                    <div className="text-theme-gray mb-1 text-sm mt-5">
                      Student's Answer
                    </div>

                    {/* Theory Answer */}
                    {ans?.theoryAnswer && (
                      <div className="mb-1 text-sm">{ans?.theoryAnswer}</div>
                    )}

                    {/* Subjective Answer */}
                    {ans?.subjectiveAnswers && (
                      <div className="mb-1 text-sm">
                        {ans.subjectiveAnswers.map((slot, slotKey) => (
                          <div key={slotKey}>
                            {`[${slot?.slotNumber}]`} {slot?.answer}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Objective Answer */}
                    {ans?.selectedOption && (
                      <div className="mb-1 text-sm">{ans?.selectedOption}</div>
                    )}

                    {/* _________________________________________________ */}
                    {/* Expected Answer */}
                    <div className="text-theme-gray mb-1 text-sm border-t pt-2">
                      Expected Answer
                    </div>

                    {/* Expected Answer Theory */}
                    {ans?.question?.expectedAnswer && (
                      <div className="mb-1 text-sm">
                        {ans?.question?.expectedAnswer}
                      </div>
                    )}

                    {/* Expected Answer Theory */}
                    {ans?.question?.correctAnswer && (
                      <div className="mb-1 text-sm">
                        {ans?.question?.options.map((opt, key) => (
                          <div
                            key={key}
                            className={`mb-1 ${opt.label === ans?.question?.correctAnswer ? " text-theme-success" : ""}`}
                          >
                            {opt.label}: {opt.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expected Answer Subjective */}
                    {ans?.question?.answerSlots.length > 0 && (
                      <div className="mb-1 text-sm">
                        {ans?.question?.answerSlots.map(
                          (slotExp, slotKeyExp) => (
                            <div key={slotKeyExp}>
                              <div>
                                {`[${slotExp.slotNumber}]`}{" "}
                                {slotExp.possibleAnswers.map(
                                  (posExp) => `${posExp}, `,
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right — marking controls (fail / set score) */}
                  {ans.status !== "auto-marked" && (
                    <div className="w-5/12 h-full my-auto cursor-pointer ">
                      <button
                        className="flex items-center bg-red-100 h-10 cursor-pointer w-fit mb-2"
                        onClick={() =>
                          markQuestion(ans?.question?.id, 0, "fail")
                        }
                      >
                        <span className="w-20 h-full border-r border-red-200 flex items-center justify-center font-semibold text-sm text-theme-error">
                          WRONG
                        </span>

                        <div className="flex items-center justify-center h-10 w-10 text-theme-error">
                          {loading !==
                          `fail-markQuestion-${ans?.question?.id}` ? (
                            <X size={22} />
                          ) : (
                            <Spinner className="h-4" />
                          )}
                        </div>
                      </button>

                      <form
                        className="flex items-center h-10 border border-emerald-200 w-fit"
                        onSubmit={(e) => {
                          e.preventDefault();
                          let target = e.target as typeof e.target & {
                            score: { value: string };
                          };
                          markQuestion(
                            ans?.question?.id,
                            Number(target.score.value),
                            "pass",
                          );
                        }}
                      >
                        <input
                          type="number"
                          name="score"
                          min={1}
                          max={ans?.question?.maxScore || 1}
                          className="flex items-center justify-center w-20 h-full border-r border-emerald-200 px-2 outline-none text-theme-gray"
                          defaultValue={ans?.score}
                          placeholder="Score"
                        />

                        <button className="flex items-center justify-center h-10 w-10 text-theme-success bg-emerald-200 hover:bg-emerald-300 cursor-pointer">
                          {loading !==
                          `pass-markQuestion-${ans?.question?.id}` ? (
                            <Check size={22} />
                          ) : (
                            <Spinner className="h-4" />
                          )}
                        </button>
                      </form>
                      <div className="text-xs text-theme-gray w-30 text-center mt-2">
                        Set Score
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Finalize marking */}
          <div className="w-60 pb-10">
            <Button
              title="Finalize Marking"
              variant="fill"
              loading={loading === "finalizeMarking"}
              onClick={finalizeMarking}
              type="button"
            />
          </div>
        </>
      )}
      <Preload loading={loading} pageData={pageData ? true : false} />
    </div>
  );
};

// ─── Page Wrapper — unwraps Next.js async params and injects SessionProvider ──
export const PageWrapper = ({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) => {
  const { id, studentId } = use(params);

  return (
    <SessionProvider>
      <Page id={id} studentId={studentId} />
    </SessionProvider>
  );
};

export default PageWrapper;
