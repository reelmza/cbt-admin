"use client";

import Spacer from "@/components/spacer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BuilderQuestion,
  ORIGIN_LABELS,
  questionImages,
  questionTypeLabel,
} from "@/lib/questionBanks";
import { Check } from "lucide-react";
import Image from "next/image";

/*
 * The panel on the left only has room for a truncated preview, so this is where
 * the whole question is readable — full text, images, and whichever answer
 * shape its type uses.
 */

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-semibold text-theme-gray uppercase tracking-wide">
    {children}
  </div>
);

const QuestionDetails = ({
  question,
  onOpenChange,
}: {
  // Doubles as the open state — null keeps the dialog closed
  question: BuilderQuestion | null;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!question) return null;

  const images = questionImages(question);
  // Objective questions mark one label correct, multiple select marks several
  const correctLabels = question.correctAnswers?.length
    ? question.correctAnswers
    : question.correctAnswer
      ? [question.correctAnswer]
      : [];

  return (
    <Dialog open={!!question} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Details</DialogTitle>
          <DialogDescription>
            {questionTypeLabel(question.type)} · {question.score ?? 1} mark
            {(question.score ?? 1) === 1 ? "" : "s"} ·{" "}
            {ORIGIN_LABELS[question.origin]}
          </DialogDescription>
        </DialogHeader>

        <Label>Question</Label>
        <div className="text-sm whitespace-pre-wrap">{question.question}</div>

        {images.length > 0 && (
          <>
            <Spacer size="sm" />
            <Label>
              Image{images.length === 1 ? "" : "s"} ({images.length})
            </Label>
            <div className="flex flex-wrap gap-3">
              {images.map((image, key) => (
                <Image
                  key={image}
                  src={image}
                  height={240}
                  width={240}
                  alt={`Question image ${key + 1}`}
                  className="h-auto w-auto max-h-60 object-contain rounded-md border"
                  unoptimized
                />
              ))}
            </div>
          </>
        )}

        {/* Objective and multiple select share the labelled option list */}
        {question.options && question.options.length > 0 && (
          <>
            <Spacer size="sm" />
            <Label>Options</Label>
            <div className="flex flex-col gap-2">
              {question.options.map((option) => {
                const isCorrect = correctLabels.includes(option.label);

                return (
                  <div
                    key={option.label}
                    className={`flex items-center gap-3 rounded-md border p-2 text-sm ${
                      isCorrect
                        ? "border-theme-success bg-theme-success/5"
                        : "border-theme-gray-mid"
                    }`}
                  >
                    <span className="font-semibold w-5 shrink-0">
                      {option.label}
                    </span>
                    <span className="grow">{option.text}</span>
                    {isCorrect && (
                      <span className="flex items-center gap-1 text-xs text-theme-success shrink-0">
                        <Check size={12} />
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Subjective questions accept any of several answers per slot */}
        {question.answerSlots && question.answerSlots.length > 0 && (
          <>
            <Spacer size="sm" />
            <Label>Accepted Answers</Label>
            <div className="flex flex-col gap-2">
              {question.answerSlots.map((slot) => (
                <div
                  key={slot.slotNumber}
                  className="rounded-md border border-theme-gray-mid p-2 text-sm"
                >
                  <span className="font-semibold">Slot {slot.slotNumber}</span>
                  <div className="text-theme-gray">
                    {slot.possibleAnswers.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {question.expectedAnswer && (
          <>
            <Spacer size="sm" />
            <Label>Expected Answer</Label>
            <div className="text-sm whitespace-pre-wrap rounded-md border border-theme-gray-mid p-2">
              {question.expectedAnswer}
            </div>
          </>
        )}

        <Spacer size="sm" />
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDetails;
