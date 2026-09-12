"use client";

import Button from "@/components/button";
import ReuseQuestions, { ReuseMode } from "@/components/reuse-questions";
import Spacer from "@/components/spacer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BankQuestion,
  questionTypeLabel,
  toSectionQuestion,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { ArrowLeft, Layers } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/*
 * Pulls saved questions into the section being built. The picking half is the
 * same component the question banks use; what this adds is the marks step,
 * since a reused question is worth whatever this paper says it is worth rather
 * than whatever it scored where it was written.
 */

const SOURCES: { value: ReuseMode; label: string }[] = [
  { value: "bank", label: "Question Bank" },
  { value: "assessment", label: "Existing Assessment" },
];

const normalize = (text: string) => text.trim().toLowerCase();

const ReuseIntoSection = ({
  open,
  onOpenChange,
  sectionType,
  sectionTitle,
  defaultScore,
  existingQuestions,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  sectionTitle: string;
  defaultScore: number;
  // Question text already in the section, so nothing is pulled in twice
  existingQuestions: string[];
  onAdd: (questions: Record<string, unknown>[]) => void;
}) => {
  const [mode, setMode] = useState<ReuseMode>("bank");
  // Null while still choosing; an array once the marks step is showing
  const [picked, setPicked] = useState<BankQuestion[] | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

  const alreadyHere = new Set(existingQuestions.map(normalize));

  const totalMarks = (picked ?? []).reduce(
    (sum, question) => sum + (Number(scores[question._id]) || 0),
    0,
  );

  const close = () => {
    onOpenChange(false);
    setPicked(null);
    setScores({});
  };

  const startMarking = async (questions: BankQuestion[]) => {
    setScores(
      Object.fromEntries(
        questions.map((question) => [question._id, String(defaultScore || 1)]),
      ),
    );
    setPicked(questions);
    return true;
  };

  const setEveryScore = (value: string) =>
    setScores((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, value])),
    );

  const confirm = () => {
    if (!picked) return;

    const invalid = picked.find(
      (question) => !(Number(scores[question._id]) > 0),
    );
    if (invalid) {
      toast.error("Every question needs a mark above zero.", toastConfig);
      return;
    }

    onAdd(
      picked.map((question) =>
        toSectionQuestion(question, Number(scores[question._id])),
      ),
    );
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {picked ? "Assign Marks" : "Add Existing Questions"}
          </DialogTitle>
          <DialogDescription>
            {picked
              ? `These marks apply to ${sectionTitle} only — the questions keep their own scores everywhere else.`
              : `Reuse ${questionTypeLabel(sectionType).toLowerCase()} questions from a question bank or another assessment.`}
          </DialogDescription>
        </DialogHeader>

        {/* Step one — pick a pool, then tick the questions */}
        {!picked && (
          <>
            <div className="flex items-center gap-1 w-fit p-1 rounded-xl bg-theme-gray-light">
              {SOURCES.map((source) => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => setMode(source.value)}
                  className={`h-8 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
                    mode === source.value
                      ? "bg-white text-accent font-medium shadow-sm"
                      : "text-theme-gray hover:text-accent-dim"
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
            <Spacer size="sm" />

            <ReuseQuestions
              key={mode}
              mode={mode}
              existingIds={[]}
              typeFilter={sectionType}
              isAdded={(question) => alreadyHere.has(normalize(question.question))}
              addLabel="to Section"
              addedNote="already in this section"
              onAdd={startMarking}
            />
          </>
        )}

        {/* Step two — say what each one is worth here */}
        {picked && (
          <>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-theme-gray">
                <span>Set every mark to</span>
                <input
                  type="number"
                  min={1}
                  defaultValue={defaultScore || 1}
                  onChange={(e) => setEveryScore(e.target.value)}
                  className="h-8 w-16 border border-accent-light rounded-md px-2 text-sm text-foreground outline-none"
                />
              </label>

              <div className="text-sm text-theme-gray">
                {picked.length} question{picked.length === 1 ? "" : "s"} ·{" "}
                {totalMarks} mark{totalMarks === 1 ? "" : "s"}
              </div>
            </div>
            <Spacer size="sm" />

            <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
              {picked.map((question, key) => (
                <div
                  key={question._id}
                  className="flex items-start gap-3 border border-theme-gray-mid rounded-xl p-3"
                >
                  <span className="text-xs text-theme-gray w-5 shrink-0 pt-1">
                    {key + 1}
                  </span>

                  <span className="grow text-sm line-clamp-2">
                    {question.question}
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={scores[question._id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [question._id]: e.target.value,
                      }))
                    }
                    className="h-8 w-16 shrink-0 border border-accent-light rounded-md px-2 text-sm text-foreground outline-none"
                  />
                </div>
              ))}
            </div>
            <Spacer size="md" />

            <div className="flex items-center gap-2">
              <div className="w-56">
                <Button
                  title={`Add ${picked.length} Question${picked.length === 1 ? "" : "s"}`}
                  loading={false}
                  variant="fill"
                  type="button"
                  icon={<Layers size={16} />}
                  onClick={confirm}
                />
              </div>

              <div className="w-32">
                <Button
                  title="Back"
                  loading={false}
                  variant="outline"
                  type="button"
                  icon={<ArrowLeft size={16} />}
                  onClick={() => setPicked(null)}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReuseIntoSection;
