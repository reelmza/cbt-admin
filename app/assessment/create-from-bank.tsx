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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getAxios } from "@/lib/axios";
import {
  BankQuestion,
  getQuestionBank,
  importBankIntoSection,
  listQuestionBanks,
  QUESTION_TYPES,
  QuestionBank,
  questionTypeLabel,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TERM_VALUES: Record<string, string> = {
  First: "1",
  Second: "2",
};

// Matches the manual create page, which also hardcodes it
const DEFAULT_TIME_LIMIT = 30;

/*
 * A bank's questions can be of mixed types, and a section's type decides how
 * its questions render for the student, so each type present becomes its own
 * section. Their order here is the order they are created in, which is what
 * the import endpoint's 0-based sectionIndex refers to.
 */
const buildSectionPlan = (questions: BankQuestion[]) => {
  const knownTypes = QUESTION_TYPES.map((item) => item.value).filter((type) =>
    questions.some((question) => question.type === type),
  );

  // A type the UI does not know about still needs somewhere to go
  const unknownTypes = [
    ...new Set(questions.map((question) => question.type)),
  ].filter((type) => !QUESTION_TYPES.some((item) => item.value === type));

  return [...knownTypes, ...unknownTypes].map((type) => ({
    type,
    title: `${questionTypeLabel(type)} Questions`,
    instruction: "Answer the questions in this section.",
    questionIds: questions
      .filter((question) => question.type === type)
      .map((question) => question._id),
  }));
};

const CreateFromBank = ({
  open,
  onOpenChange,
  courses,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: { _id: string; code: string; title: string }[] | null;
  onCreated: () => void;
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [schoolConfig, setSchoolConfig] = useState<{
    academicSession: string;
    academicYear: string;
  } | null>(null);
  const [banks, setBanks] = useState<QuestionBank[] | null>(null);
  // The full bank, fetched on pick because only the detail route carries the
  // questions needed to lay out sections and total the marks
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [startDate, setStartDate] = useState("");

  const today = new Date().toLocaleDateString("en-CA");
  const bankQuestions = selectedBank?.questions ?? [];
  const sectionPlan = buildSectionPlan(bankQuestions);
  const totalMarks = bankQuestions.reduce(
    (sum, question) => sum + (question.score ?? 1),
    0,
  );

  const pickBank = async (bankId: string) => {
    setSelectedBank(null);
    setLoading("bank");
    const bank = await getQuestionBank(bankId);
    setSelectedBank(bank);
    setLoading(null);
  };

  const createAssessment = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      courseId: { value: string };
      session: { value: string };
      term: { value: string };
      startDate: { value: string };
      dueDate: { value: string };
      instruction: { value: string };
      status: { value: string };
      sectionTimeLimit: { value: string };
    };

    if (!selectedBank) {
      toast.error("Select a question bank.", toastConfig);
      return;
    }

    if (bankQuestions.length === 0) {
      toast.error(
        "That question bank has no questions to import yet.",
        toastConfig,
      );
      return;
    }

    if (target.startDate.value < today) {
      toast.error("Start date cannot be earlier than today.", toastConfig);
      return;
    }

    if (new Date(target.dueDate.value) < new Date(target.startDate.value)) {
      toast.error(
        "Due date cannot be earlier than the start date.",
        toastConfig,
      );
      return;
    }

    setLoading("create");

    const course = courses?.find((item) => item._id === target.courseId.value);

    // One figure applies to every section the bank produces, since there is no
    // per-section step in this flow
    const sectionTimeLimit = Number(target.sectionTimeLimit.value) || 0;

    const payload = {
      title: course?.code ?? "",
      course: target.courseId.value,
      session: target.session.value,
      term: target.term.value,
      instruction: target.instruction.value,
      status: target.status.value,
      startDate: new Date(target.startDate.value).toISOString(),
      dueDate: new Date(target.dueDate.value).toISOString(),
      totalMarks,
      timeLimit: sectionTimeLimit
        ? sectionTimeLimit * sectionPlan.length
        : DEFAULT_TIME_LIMIT,
      // Created empty, then filled by the import calls below. No image key at
      // all — the API rejects an empty one with a 422.
      sections: sectionPlan.map(({ questionIds, ...section }) => ({
        ...section,
        timeLimit: sectionTimeLimit,
        questions: [],
      })),
    };

    let assessmentId: string | undefined;

    try {
      const api = await getAxios();
      const res = await api.post("/school/create-assessment", payload);
      const data = res?.data?.data;
      assessmentId = data?.assessment?._id ?? data?._id;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to create the assessment, please retry.",
        toastConfig,
      );
      setLoading(null);
      return;
    }

    if (!assessmentId) {
      // The assessment exists but its id never came back, so the questions
      // cannot be imported — say so rather than reporting a clean success
      toast.error(
        "Assessment created, but its questions could not be imported. Open it and import the bank manually.",
        toastConfig,
      );
      setLoading(null);
      onOpenChange(false);
      onCreated();
      return;
    }

    let imported = 0;
    for (const [sectionIndex, section] of sectionPlan.entries()) {
      const result = await importBankIntoSection({
        bankId: selectedBank._id,
        assessmentId,
        sectionIndex,
        questionIds: section.questionIds,
      });
      if (result) imported += result.imported;
    }

    setLoading(null);
    onOpenChange(false);
    onCreated();

    toast.success(
      imported > 0
        ? `Assessment created with ${imported} question${imported === 1 ? "" : "s"} from ${selectedBank.title}.`
        : "Assessment created, but no questions were imported.",
      toastConfig,
    );
  };

  // Loaded when the dialog opens so the lists are never stale on reopen
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    const getData = async () => {
      setLoading("page");
      // The form itself remounts with the dialog, so the state behind it has to
      // be cleared too or a reopened dialog shows the previous pick
      setSelectedBank(null);
      setStartDate("");

      const [configRes, banksRes] = await Promise.all([
        (async () => {
          try {
            const api = await getAxios();
            return await api.get("/config/school", {
              signal: controller.signal,
            });
          } catch {
            return null;
          }
        })(),
        listQuestionBanks({ page: 1, signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      if (configRes?.status === 200) setSchoolConfig(configRes.data.data);
      setBanks(banksRes?.banks ?? []);
      setLoading(null);
    };

    getData();

    return () => controller.abort();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create from Question Bank</DialogTitle>
          <DialogDescription>
            The bank's questions are imported straight into the new assessment.
          </DialogDescription>
        </DialogHeader>

        {loading === "page" ? (
          <div className="w-full flex flex-col items-center border rounded-md p-10">
            <Spinner className="size-6 text-theme-gray" />
            <Spacer size="sm" />
            <div className="text-theme-gray">Fetching question banks</div>
          </div>
        ) : (
          <form onSubmit={createAssessment}>
            {/* Question Bank */}
            <Select name="questionBank" onValueChange={pickBank} required>
              <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                <SelectValue placeholder="Select a question bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select question bank</SelectLabel>
                  {banks?.map((bank) => (
                    <SelectItem value={bank._id} key={bank._id}>
                      {bank.title}
                      {bank.subject ? ` — ${bank.subject}` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* What the picked bank will contribute */}
            {loading === "bank" ? (
              <div className="flex items-center gap-2 text-sm text-theme-gray mt-2">
                <Spinner className="size-3" />
                <span>Reading the bank</span>
              </div>
            ) : (
              ""
            )}

            {selectedBank && loading !== "bank" ? (
              <div className="text-sm text-theme-gray mt-2">
                {bankQuestions.length} question
                {bankQuestions.length === 1 ? "" : "s"}, {totalMarks} mark
                {totalMarks === 1 ? "" : "s"}
                {sectionPlan.length > 0
                  ? ` — ${sectionPlan
                      .map(
                        (section) =>
                          `${questionTypeLabel(section.type)} (${section.questionIds.length})`,
                      )
                      .join(", ")}`
                  : ""}
              </div>
            ) : (
              ""
            )}
            <Spacer size="sm" />

            {/* Course */}
            <Select name="courseId" required>
              <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select course</SelectLabel>
                  {courses?.map((course) => (
                    <SelectItem value={course._id} key={course._id}>
                      {`${course.code} - ${course.title}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Spacer size="sm" />

            {/* Session and Term */}
            <div className="flex items-center justify-between gap-2">
              <Select name="session" required>
                <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Year</SelectLabel>
                    {schoolConfig?.academicSession && (
                      <SelectItem value={schoolConfig.academicSession}>
                        {schoolConfig.academicSession}
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select name="term" required>
                <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Semester</SelectLabel>
                    {schoolConfig?.academicYear && (
                      <SelectItem
                        value={
                          TERM_VALUES[schoolConfig.academicYear] ??
                          schoolConfig.academicYear
                        }
                      >
                        {schoolConfig.academicYear}
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Spacer size="sm" />

            {/* Instructions */}
            <Input
              name="instruction"
              type="text"
              placeholder="Assessment Instruction"
              required
            />
            <Spacer size="sm" />

            {/* Applied to every section the bank produces */}
            <Input
              name="sectionTimeLimit"
              type="number"
              placeholder="Time limit per section in minutes, 0 for untimed"
              defaultValue="0"
            />
            <Spacer size="sm" />

            {/* Status */}
            <Select name="status" required>
              <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Status</SelectLabel>
                  <SelectItem value="published">Publish Now</SelectItem>
                  <SelectItem value="draft">Save Draft</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Spacer size="sm" />

            {/* Start & Due Date */}
            <div className="flex items-end justify-between gap-2">
              <div className="w-full">
                <span className="text-xs text-theme-gray">Start</span>
                <input
                  type="date"
                  name="startDate"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 border rounded-md border-accent-light text-theme-gray text-sm w-full px-2 outline-none"
                  required
                />
              </div>

              <div className="w-full">
                <span className="text-xs text-theme-gray">Due Date</span>
                <input
                  type="date"
                  name="dueDate"
                  min={startDate || undefined}
                  className="h-10 border rounded-md border-accent-light text-theme-gray text-sm w-full px-2 outline-none"
                  required
                />
              </div>
            </div>
            <Spacer size="md" />

            <Button
              title="Create Assessment"
              loading={loading === "create"}
              variant="fill"
              icon={<Layers size={20} />}
            />
            <Spacer size="md" />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateFromBank;
