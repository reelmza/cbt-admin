"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImage } from "@/lib/fileUpload";
import {
  BankQuestion,
  createQuestion,
  OPTION_LABELS,
  QUESTION_TYPES,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { Check, Trash2Icon, UploadCloud, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

// A question holds at most 2 images, so 1MB in total at the shared per-file cap
const MAX_IMAGES = 2;

const CreateQuestion = ({
  onCreated,
}: {
  // Resolves true once the question is saved into the bank, which is the signal
  // to clear the form for the next one
  onCreated: (question: BankQuestion) => Promise<boolean>;
}) => {
  const { data: session } = useSession();
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [question, setQuestion] = useState("");
  const [score, setScore] = useState("1");
  // Objective options, subjective answer slots and the theory expected answer
  // all collapse to a list of strings, indexed by position
  const [options, setOptions] = useState<string[]>([]);
  // Holds one label for objective, comma-joined labels for multiple select
  const [correctAnswer, setCorrectAnswer] = useState<string | null>("A");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const isObjective =
    questionType === "multiple_choice" || questionType === "multiple_select";

  const resetForm = () => {
    setQuestion("");
    setOptions([]);
    setCorrectAnswer(questionType === "multiple_select" ? null : "A");
    setImages([]);
  };

  // Switching type invalidates whatever answers were already filled in
  const changeQuestionType = (nextType: string) => {
    setQuestionType(nextType);
    setOptions([]);
    setCorrectAnswer(nextType === "multiple_select" ? null : "A");
  };

  // Shapes the payload the way each question type is stored, mirroring the
  // section forms on /assessment/create
  const buildPayload = () => {
    const shared = {
      question: question.trim(),
      type: questionType,
      score: Number(score) || 1,
      ...(images.length > 0 && { image: images.join(",") }),
    };

    if (questionType === "multiple_choice") {
      return {
        ...shared,
        options: options.map((text, key) => ({
          label: OPTION_LABELS[key],
          text,
        })),
        correctAnswer: correctAnswer as string,
      };
    }

    if (questionType === "multiple_select") {
      return {
        ...shared,
        options: options.map((text, key) => ({
          label: OPTION_LABELS[key],
          text,
        })),
        correctAnswers: correctAnswer
          ? correctAnswer.split(",").filter(Boolean)
          : [],
      };
    }

    if (questionType === "subjective") {
      return {
        ...shared,
        answerSlots: options.map((text, key) => ({
          slotNumber: key + 1,
          possibleAnswers: text.split(",").map((answer) => answer.trim()),
        })),
      };
    }

    return {
      ...shared,
      expectedAnswer: options[0],
      requiresManualMarking: true,
    };
  };

  // Returns the first problem found, or null when the form is ready to submit
  const findValidationError = () => {
    if (!question.trim()) return "Enter the question text.";

    if (isObjective) {
      if (options.length < 2) return "Add at least two answer options.";
      if (options.some((option) => !option.trim()))
        return "Every answer option needs text.";
      if (!correctAnswer) return "Mark which option is correct.";
    }

    if (questionType === "subjective") {
      if (options.length < 1) return "Add at least one answer slot.";
      if (options.some((option) => !option.trim()))
        return "Every answer slot needs at least one accepted answer.";
    }

    if (questionType === "theory" && !options[0]?.trim())
      return "Enter the expected answer.";

    return null;
  };

  const addQuestion = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const validationError = findValidationError();
    if (validationError) {
      toast.error(validationError, toastConfig);
      return;
    }

    if (!session?.user?.id) {
      toast.error("Your session has expired, sign in again.", toastConfig);
      return;
    }

    setLoading("addQuestion");
    // The question is saved on its own first; only then can its id be attached
    // to the bank, so a failure here leaves the bank untouched
    const created = await createQuestion(session.user.id, buildPayload());

    if (!created?._id) {
      setLoading(null);
      return;
    }

    const added = await onCreated(created);
    setLoading(null);
    if (added) resetForm();
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    // Let the same file be picked again after a rejected upload
    input.value = "";

    setLoading("uploadImage");
    const url = await uploadImage(file);
    setLoading(null);

    if (url) setImages((prev) => [...prev, url]);
  };

  return (
    <form onSubmit={addQuestion}>
      {/* Question type & score */}
      <div className="flex items-end gap-3">
        <div className="w-60">
          <div className="text-xs text-theme-gray mb-1">Question type</div>
          <Select value={questionType} onValueChange={changeQuestionType}>
            <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
              <SelectValue placeholder="Question type" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((item) => (
                <SelectItem value={item.value} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <div className="text-xs text-theme-gray mb-1">Score</div>
          <Input
            name="score"
            type="number"
            placeholder="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />
        </div>
      </div>
      <Spacer size="sm" />

      {/* Question Text Box */}
      <textarea
        className="w-full outline-none border rounded-md p-3 min-h-38 max-h-38"
        placeholder="Type your question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      ></textarea>
      <Spacer size="sm" />

      {/* Options Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`font-semibold ${
              questionType !== "theory" ? "border-r" : ""
            } pr-2`}
          >
            {questionType === "theory"
              ? "Expected Answer"
              : questionType === "subjective"
                ? "Answer Slots"
                : "Options"}
          </div>

          {questionType !== "theory" && (
            <button
              className="text-sm text-accent cursor-pointer leading-none pr-2"
              type="button"
              onClick={() =>
                setOptions((prev) => {
                  // Objective questions are capped at the four labelled options
                  if (isObjective && prev.length >= OPTION_LABELS.length)
                    return prev;
                  return [...prev, ""];
                })
              }
            >
              {questionType === "subjective"
                ? "Add answer slot"
                : "Add answer option"}
            </button>
          )}
        </div>

        {/* Image Upload - up to 2 images per question */}
        <div className="flex items-center gap-2">
          {images.map((img, key) => (
            <div
              key={img}
              className="flex items-center gap-2 pl-2 h-7 rounded-md overflow-hidden text-accent bg-accent-light"
            >
              <button
                className="text-sm cursor-pointer"
                onClick={() => setShowImagePreview(true)}
                type="button"
              >
                Image {key + 1}
              </button>

              <button
                className="w-5 flex items-center justify-center h-full bg-accent text-accent-light cursor-pointer"
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((_, i) => i !== key))
                }
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <div className="relative overflow-hidden flex items-center gap-2 px-2 cursor-pointer text-accent bg-accent-light h-7 rounded-md">
              <UploadCloud size={16} />
              <div className="text-accent text-sm">
                {loading === "uploadImage" ? "Uploading…" : "Upload Image"}
              </div>
              <input
                name="questionImage"
                type="file"
                className="absolute -left-30 opacity-0 cursor-pointer"
                accept=".jpeg,.png,.jpg"
                onChange={pickImage}
              />
            </div>
          )}
        </div>
      </div>
      <Spacer size="sm" />

      {/* Options */}
      <div className="w-full flex">
        {/* Objective correct answer radios */}
        {questionType === "multiple_choice" && options.length > 0 && (
          <div className="w-fit">
            <RadioGroup
              value={correctAnswer ?? undefined}
              className="gap-0"
              onValueChange={(value: string) => setCorrectAnswer(value)}
            >
              {options.map((_, key) => (
                <div className="flex items-center h-10 mb-1" key={key}>
                  <RadioGroupItem
                    value={OPTION_LABELS[key]}
                    id={`option-${key + 1}`}
                  />
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Multiple select correct answer checkboxes */}
        {questionType === "multiple_select" && options.length > 0 && (
          <div className="w-fit">
            {options.map((_, key) => {
              const label = OPTION_LABELS[key];
              const selected = correctAnswer
                ? correctAnswer.split(",").includes(label)
                : false;

              return (
                <div className="flex items-center h-10 mb-1" key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      const current = correctAnswer
                        ? correctAnswer.split(",").filter(Boolean)
                        : [];
                      const updated = current.includes(label)
                        ? current.filter((item) => item !== label)
                        : [...current, label];
                      setCorrectAnswer(
                        updated.length ? updated.join(",") : null,
                      );
                    }}
                    className={`size-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      selected
                        ? "bg-accent border-accent text-white"
                        : "border-theme-gray-mid"
                    }`}
                  >
                    {selected && <Check size={10} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Options Main */}
        <div className="grow">
          {questionType !== "theory" &&
            options.map((option, key) => (
              <div className="flex items-center mb-1" key={key}>
                <div
                  className={`h-full flex items-center text-sm font-semibold ${
                    isObjective ? "w-14 justify-center" : "w-20"
                  }`}
                >
                  {isObjective ? OPTION_LABELS[key] : `Slot ${key + 1}`}
                </div>

                <Input
                  name={`option-${key + 1}`}
                  type="text"
                  placeholder={
                    isObjective ? "Enter an option" : "Ans 1, Ans 2, Ans 3"
                  }
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) => {
                      const next = [...prev];
                      next[key] = e.target.value;
                      return next;
                    })
                  }
                />

                <button
                  className="h-10 w-10 hover:text-theme-error flex items-center justify-center cursor-pointer"
                  type="button"
                  onClick={() => {
                    setOptions((prev) => prev.filter((_, i) => i !== key));
                    // Labels shift when an option is dropped, so the previous
                    // pick no longer points at the same answer
                    setCorrectAnswer(
                      questionType === "multiple_select" ? null : "A",
                    );
                  }}
                >
                  <Trash2Icon size={14} />
                </button>
              </div>
            ))}

          {questionType === "theory" && (
            <div className="flex items-center mb-1">
              <Input
                name="expectedAnswer"
                type="text"
                placeholder="Enter expected answer"
                value={options[0] || ""}
                onChange={(e) => setOptions([e.target.value])}
              />
            </div>
          )}
        </div>
      </div>
      <Spacer size="md" />

      <div className="w-52">
        <Button
          title="Add to Question Bank"
          loading={loading === "addQuestion"}
          variant="fill"
        />
      </div>

      {/* Dialog - Preview Uploaded Image */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Image{images.length > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              {images.length > 1
                ? "These are the images that will be displayed to the student"
                : "This is the image that will be displayed to the student"}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex flex-wrap items-center justify-center gap-3">
            {images.map((img, key) => (
              <Image
                key={img}
                src={img}
                height={320}
                width={320}
                alt={`Question image ${key + 1}`}
                className="h-auto w-auto max-h-80 object-contain"
                unoptimized
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CreateQuestion;
