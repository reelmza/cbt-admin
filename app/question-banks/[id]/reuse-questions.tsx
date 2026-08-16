"use client";

import Button from "@/components/button";
import Spacer from "@/components/spacer";
import TableSearchBox from "@/components/table-searchbox";
import { Spinner } from "@/components/ui/spinner";
import {
  BankQuestion,
  getAssessmentQuestions,
  getQuestionBank,
  listAssessments,
  listQuestionBanks,
  questionTypeLabel,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { Check, Plus, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/*
 * Picking an existing question is the same two steps whichever pool it comes
 * from — choose a source, then tick the questions — so both reuse flows share
 * this component and differ only in how the two lists are fetched.
 */

export type ReuseMode = "assessment" | "bank";

type SourceItem = { _id: string; title: string; subtitle: string };

const MODE_COPY: Record<
  ReuseMode,
  { sourceName: string; searchPlaceholder: string; emptySources: string }
> = {
  assessment: {
    sourceName: "assessment",
    searchPlaceholder: "Search assessments",
    emptySources: "No assessments found.",
  },
  bank: {
    sourceName: "question bank",
    searchPlaceholder: "Search question banks",
    emptySources: "No other question banks found.",
  },
};

const CheckMark = ({ checked }: { checked: boolean }) => (
  <span
    className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
      checked ? "bg-accent border-accent text-white" : "border-theme-gray-mid"
    }`}
  >
    {checked && <Check size={12} />}
  </span>
);

const ReuseQuestions = ({
  mode,
  excludeBankId,
  existingIds,
  onAdd,
}: {
  mode: ReuseMode;
  // The bank being built is never offered as a source of itself
  excludeBankId?: string;
  // Questions already in the bank are shown but cannot be picked again
  existingIds: string[];
  onAdd: (questions: BankQuestion[]) => Promise<boolean>;
}) => {
  const [sources, setSources] = useState<SourceItem[] | null>(null);
  const [sourceSearch, setSourceSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[] | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const copy = MODE_COPY[mode];

  const selectableQuestions =
    questions?.filter((item) => !existingIds.includes(item._id)) ?? [];
  const allSelected =
    selectableQuestions.length > 0 &&
    checkedIds.length === selectableQuestions.length;

  const toggleQuestion = (questionId: string) =>
    setCheckedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((item) => item !== questionId)
        : [...prev, questionId],
    );

  const openSource = async (source: SourceItem) => {
    setSelectedSource(source);
    setQuestions(null);
    setCheckedIds([]);
    setLoading("questions");

    const result =
      mode === "assessment"
        ? await getAssessmentQuestions(source._id)
        : (await getQuestionBank(source._id))?.questions;

    setQuestions(result ?? []);
    setLoading(null);
  };

  const addChecked = async () => {
    const picked = selectableQuestions.filter((item) =>
      checkedIds.includes(item._id),
    );
    if (picked.length === 0) {
      toast.error("Select at least one question.", toastConfig);
      return;
    }

    setLoading("add");
    const added = await onAdd(picked);
    setLoading(null);

    // Leave the list open on success so more can be picked from the same source
    if (added) setCheckedIds([]);
  };

  // Debounced source search, which also performs the first load
  useEffect(() => {
    const timeout = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading("sources");

      if (mode === "assessment") {
        const assessments = await listAssessments(
          sourceSearch,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setSources(
          assessments?.map((item) => ({
            _id: item._id,
            title: item.title,
            subtitle: [item.session, item.status].filter(Boolean).join(" · "),
          })) ?? [],
        );
      } else {
        const result = await listQuestionBanks({
          search: sourceSearch,
          page: 1,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setSources(
          result?.banks
            .filter((item) => item._id !== excludeBankId)
            .map((item) => ({
              _id: item._id,
              title: item.title,
              subtitle: item.subject ?? "",
            })) ?? [],
        );
      }

      setLoading(null);
    }, 350);

    return () => clearTimeout(timeout);
  }, [sourceSearch, mode]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  // Step one — choose which assessment or bank to pull from
  if (!selectedSource) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <TableSearchBox
            placeholder={copy.searchPlaceholder}
            onChange={(e) => setSourceSearch(e.target.value)}
          />
          {loading === "sources" ? (
            <Spinner className="size-4 text-theme-gray" />
          ) : (
            ""
          )}
        </div>
        <Spacer size="sm" />

        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
          {sources?.map((source) => (
            <button
              key={source._id}
              type="button"
              onClick={() => openSource(source)}
              className="border border-theme-gray-mid rounded-xl p-3 text-left hover:border-theme-gray-dim transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium">{source.title}</div>
              {source.subtitle ? (
                <div className="text-xs text-theme-gray mt-1">
                  {source.subtitle}
                </div>
              ) : (
                ""
              )}
            </button>
          ))}

          {sources?.length === 0 ? (
            <div className="text-sm text-theme-gray border border-dashed border-theme-gray-mid rounded-xl p-4 text-center">
              {copy.emptySources}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }

  // Step two — tick the questions to pull across
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-theme-gray hover:text-accent cursor-pointer shrink-0"
          onClick={() => {
            setSelectedSource(null);
            setQuestions(null);
            setCheckedIds([]);
          }}
        >
          <RefreshCw size={14} />
          <span>Change {copy.sourceName}</span>
        </button>

        <div className="min-w-0 text-right">
          <div className="font-semibold truncate">{selectedSource.title}</div>
          <div className="text-xs text-theme-gray">
            {questions ? `${questions.length} question(s)` : "Loading…"}
          </div>
        </div>
      </div>
      <Spacer size="sm" />

      {loading === "questions" ? (
        <div className="flex items-center gap-2 text-sm text-theme-gray">
          <Spinner className="size-4" />
          <span>Fetching questions</span>
        </div>
      ) : (
        ""
      )}

      {questions && questions.length > 0 && (
        <>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-accent cursor-pointer"
            onClick={() =>
              setCheckedIds(
                allSelected
                  ? []
                  : selectableQuestions.map((item) => item._id),
              )
            }
          >
            <CheckMark checked={allSelected} />
            <span>{allSelected ? "Clear selection" : "Select all"}</span>
          </button>
          <Spacer size="sm" />

          <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
            {questions.map((item) => {
              const alreadyAdded = existingIds.includes(item._id);
              const checked = checkedIds.includes(item._id);

              return (
                <button
                  key={item._id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => toggleQuestion(item._id)}
                  className={`flex items-start gap-3 border rounded-xl p-3 text-left transition-colors ${
                    alreadyAdded
                      ? "border-theme-gray-mid opacity-50 cursor-not-allowed"
                      : checked
                        ? "border-accent bg-accent-light/30 cursor-pointer"
                        : "border-theme-gray-mid hover:border-theme-gray-dim cursor-pointer"
                  }`}
                >
                  <CheckMark checked={checked || alreadyAdded} />

                  <span className="grow">
                    <span className="block text-sm">{item.question}</span>
                    <span className="block text-xs text-theme-gray mt-1">
                      {questionTypeLabel(item.type)}
                      {alreadyAdded ? " · already in this bank" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <Spacer size="md" />

          <div className="w-56">
            <Button
              title={
                checkedIds.length
                  ? `Add ${checkedIds.length} to Bank`
                  : "Add to Bank"
              }
              loading={loading === "add"}
              variant="fill"
              type="button"
              icon={<Plus size={16} />}
              onClick={addChecked}
            />
          </div>
        </>
      )}

      {questions?.length === 0 && loading !== "questions" ? (
        <div className="text-sm text-theme-gray border border-dashed border-theme-gray-mid rounded-md p-4 text-center">
          This {copy.sourceName} has no questions to pull from.
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default ReuseQuestions;
