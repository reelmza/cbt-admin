"use client";

import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addQuestionsToBank,
  BankQuestion,
  BuilderQuestion,
  getQuestionBank,
  QuestionBank,
  QuestionOrigin,
  removeQuestionsFromBank,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { ArrowLeft } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddedQuestions from "./added-questions";
import CreateQuestion from "./create-question";
import ReuseQuestions from "./reuse-questions";

/*
 * Which interface is showing in the creation panel. Each one ends in the same
 * place — a saved question whose id gets attached to this bank — so the panel
 * only decides where the question comes from.
 */
type QuestionSource = "create" | "assessment" | "bank";

const SOURCE_OPTIONS: { value: QuestionSource; label: string }[] = [
  { value: "create", label: "Create New" },
  { value: "assessment", label: "Select from Existing Assessment" },
  { value: "bank", label: "Select from Question Bank" },
];

// The source a question was pulled from, in the vocabulary the panel tracks
const SOURCE_ORIGINS: Record<QuestionSource, QuestionOrigin> = {
  create: "created",
  assessment: "assessment",
  bank: "bank",
};

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [source, setSource] = useState<QuestionSource | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Attaching is identical for every source: skip what is already here, save
  // the ids against the bank, then show them in the panel on the left
  const attachQuestions = async (
    incoming: BankQuestion[],
    origin: QuestionOrigin,
  ) => {
    const fresh = incoming.filter(
      (item) => !questions.some((added) => added._id === item._id),
    );

    if (fresh.length === 0) {
      toast.error("Those questions are already in this bank.", toastConfig);
      return false;
    }

    const saved = await addQuestionsToBank(
      id,
      fresh.map((item) => item._id),
    );
    if (!saved) return false;

    setQuestions((prev) => [
      ...prev,
      ...fresh.map((item) => ({ ...item, origin })),
    ]);
    toast.success(
      `${fresh.length} question${fresh.length === 1 ? "" : "s"} added.`,
      toastConfig,
    );
    return true;
  };

  const detachQuestion = async (questionId: string) => {
    setRemovingId(questionId);
    const removed = await removeQuestionsFromBank(id, [questionId]);
    setRemovingId(null);
    if (!removed) return;

    setQuestions((prev) => prev.filter((item) => item._id !== questionId));
    toast.success("Question removed from this bank.", toastConfig);
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getData = async () => {
      const result = await getQuestionBank(id, controller.signal);
      if (controller.signal.aborted) return;

      if (!result) {
        setLoading("pageError");
        return;
      }

      setBank(result);
      // Questions saved before this session carry no provenance, so they are
      // all labelled as simply being in the bank
      setQuestions(
        (result.questions ?? []).map((item) => ({
          ...item,
          origin: "saved" as QuestionOrigin,
        })),
      );
      setLoading(null);
    };

    !bank && getData();

    return () => controller.abort();
  }, [session?.user?.id, id]);

  return (
    <div className="w-full h-full p-10 font-sans flex flex-col">
      {bank && (
        <>
          {/* Bank heading */}
          <div className="shrink-0">
            <Link
              href="/question-banks"
              className="flex items-center gap-1 text-sm text-theme-gray hover:text-accent w-fit"
            >
              <ArrowLeft size={14} />
              <span>All question banks</span>
            </Link>
            <Spacer size="sm" />

            <div className="text-xl font-bold text-accent">{bank.title}</div>
            <div className="flex gap-3 text-sm text-theme-gray">
              {bank.subject ? <span>{bank.subject}</span> : ""}
              {bank.description ? <span>{bank.description}</span> : ""}
            </div>
          </div>
          <Spacer size="md" />

          <div className="grow flex gap-5 min-h-0">
            {/* Added questions, kept narrow — it is a summary only */}
            <div className="w-3/10 shrink-0">
              <AddedQuestions
                questions={questions}
                onRemove={detachQuestion}
                removingId={removingId}
              />
            </div>

            {/* Question creation, given the room to work in */}
            <div className="w-7/10 border rounded-md shadow-xl shadow-theme-gray-light/30 px-5 py-4 overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="w-80">
                  <Select
                    value={source ?? undefined}
                    onValueChange={(value) =>
                      setSource(value as QuestionSource)
                    }
                  >
                    <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                      <SelectValue placeholder="How do you want to add a question?" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((item) => (
                        <SelectItem value={item.value} key={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Always available, so a half-finished flow is never a dead end */}
                {source ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-theme-gray hover:text-accent cursor-pointer"
                    onClick={() => setSource(null)}
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                ) : (
                  ""
                )}
              </div>
              <Spacer size="md" />

              {source === "create" && (
                <CreateQuestion
                  onCreated={(question) =>
                    attachQuestions([question], SOURCE_ORIGINS.create)
                  }
                />
              )}

              {source === "assessment" && (
                <ReuseQuestions
                  mode="assessment"
                  existingIds={questions.map((item) => item._id)}
                  onAdd={(picked) =>
                    attachQuestions(picked, SOURCE_ORIGINS.assessment)
                  }
                />
              )}

              {source === "bank" && (
                <ReuseQuestions
                  mode="bank"
                  excludeBankId={id}
                  existingIds={questions.map((item) => item._id)}
                  onAdd={(picked) =>
                    attachQuestions(picked, SOURCE_ORIGINS.bank)
                  }
                />
              )}

              {!source ? (
                <div className="text-sm text-theme-gray border border-dashed border-theme-gray-mid rounded-md p-10 text-center">
                  Pick an option above to write a new question, or to reuse
                  questions from an assessment or another question bank.
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </>
      )}

      <Preload loading={loading} pageData={bank ? true : false} />
    </div>
  );
};

const QuestionBankBuilder = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default QuestionBankBuilder;
