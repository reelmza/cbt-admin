"use client";

import { Spinner } from "@/components/ui/spinner";
import {
  BuilderQuestion,
  ORIGIN_LABELS,
  questionTypeLabel,
} from "@/lib/questionBanks";
import { X } from "lucide-react";
import { useState } from "react";
import QuestionDetails from "./question-details";

// The panel is a summary only, so long question text is cut to a fixed width
const PREVIEW_LENGTH = 20;

const truncate = (text: string) =>
  text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;

const AddedQuestions = ({
  questions,
  onRemove,
  removingId,
}: {
  questions: BuilderQuestion[];
  onRemove: (questionId: string) => void;
  removingId: string | null;
}) => {
  // Holds the question being read in full; doubles as the dialog's open state
  const [viewedQuestion, setViewedQuestion] = useState<BuilderQuestion | null>(
    null,
  );

  return (
    <div className="h-full border rounded-md shadow-xl shadow-theme-gray-light/30 px-5 py-3 flex flex-col overflow-hidden">
      <div className="font-semibold text-xl shrink-0">Added Questions</div>
      <div className="text-sm text-theme-gray shrink-0">
        {questions.length} question{questions.length === 1 ? "" : "s"} in this
        bank
      </div>

      <div className="grow overflow-y-auto mt-4 flex flex-col gap-2">
        {questions.map((item, key) => (
          <div
            key={item._id}
            className="border border-theme-gray-mid rounded-md p-2 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-theme-gray text-xs">{key + 1}.</span>
                <span className="text-xs rounded-sm py-[1px] px-1.5 bg-accent-light text-accent">
                  {questionTypeLabel(item.type)}
                </span>
              </div>

              <button
                type="button"
                title="Remove from bank"
                className="text-theme-gray hover:text-theme-error cursor-pointer shrink-0"
                onClick={() => onRemove(item._id)}
              >
                {removingId === item._id ? (
                  <Spinner className="size-3" />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>

            <div className="mt-1">{truncate(item.question)}</div>

            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xs text-theme-gray">
                {ORIGIN_LABELS[item.origin]}
              </span>

              <button
                type="button"
                className="text-xs text-accent underline underline-offset-2 cursor-pointer shrink-0"
                onClick={() => setViewedQuestion(item)}
              >
                View Question
              </button>
            </div>
          </div>
        ))}

        {questions.length === 0 ? (
          <div className="text-sm text-theme-gray border border-dashed border-theme-gray-mid rounded-md p-4 text-center">
            Nothing added yet. Use the panel on the right to create a question or
            pull one in from an assessment or another bank.
          </div>
        ) : (
          ""
        )}
      </div>

      <QuestionDetails
        question={viewedQuestion}
        onOpenChange={(open) => !open && setViewedQuestion(null)}
      />
    </div>
  );
};

export default AddedQuestions;
