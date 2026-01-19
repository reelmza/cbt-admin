"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { ArrowRight, Plus, RefreshCcw, Trash2Icon, X } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { QuestionFormType, AssessmentType, SectionType } from "./create.types";
import { useRouter } from "next/navigation";

const Main = () => {
  const controller = new AbortController();
  const { data: session } = useSession();
  const router = useRouter();

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(true);
  const [showSectionsModal, setShowSectionsModal] = useState(false);

  // Main Page States
  const [loading, setLoading] = useState<string | null>("page");
  const [courses, setCourses] = useState<
    { _id: string; code: string; title: string }[] | null
  >(null);

  const [assDetails, setAssDetails] = useState<AssessmentType | null>(null);
  const [activeSection, setActiveSection] = useState<null | [string, number]>(
    null
  );
  const [sections, setSections] = useState<SectionType | null>([]);

  // Question component states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>("A");

  // Delete a section
  const deleteSection = (type: String) => {
    setSections((prev) => {
      if (!prev) return prev;
      return prev.filter((sect) => sect.type !== type);
    });
    setActiveSection(null);
    setQuestion("");
    setOptions([]);
    setCorrectAnswer("A");
  };

  // Submit assessment
  const submitAss = async () => {
    setLoading("submitAss");
    let formData = { ...assDetails };
    if (!sections) return;

    // @ts-expect-error Remove defaultQuestionScore property that is not in the database schema and causes error upon upload.
    formData.sections = sections.map((sect) => {
      const { defaultQuestionScore, ...formatedSect } = sect;
      return formatedSect;
    });

    try {
      const res = await localAxios.post(`/school/create-assessment`, formData);
      if (res.status === 201) {
        router.push("/assessment");
      }
      setLoading(null);
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session) return;

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/admin/courses", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          setCourses(res.data.data.courses);
        }
        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    // Compensate for dev mode double data fetching
    !courses && getData();

    return () => {
      // Cancel any api request on page unmount
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full flex p-10 font-sans">
      {/* Main Page Content */}
      {assDetails && (
        <>
          {/* Main Content */}
          <div className="w-7/10 pr-5">
            {/* Assessment Details */}
            <div className="w-fit">
              {/* Assesment title */}
              <div className="text-xl font-bold text-accent">
                {courses?.find((item) => item._id == assDetails?.course)?.code +
                  " - " +
                  courses?.find((item) => item._id == assDetails?.course)
                    ?.title}
              </div>

              {/* Other Details */}
              <div className="flex gap-2">
                <div className="text-sm flex">
                  <div className="font-semibold mr-1">Session:</div>
                  <div>{assDetails?.session}</div>
                </div>

                <div className="text-sm flex">
                  <div className="font-semibold mr-1">Due Date:</div>
                  <div>{assDetails?.dueDate.split("T")[0]}</div>
                </div>

                <div className="text-sm flex">
                  <div className="font-semibold mr-1">Total Marks:</div>
                  <div>{assDetails?.totalMarks}</div>
                </div>
              </div>
            </div>
            <Spacer size="md" />

            {/* Section Indicator for debug */}
            <div className="hisdden text-xs text-emerald-600 font-semibsold">
              {activeSection || "No Active Section"}
            </div>

            {/* Objective Questions */}
            {activeSection && activeSection[0] === "multiple_choice" && (
              <QuestionForm
                formType="multiple_choice"
                sectionParams={{ sections, setSections }}
                questionParams={{ question, setQuestion }}
                optionsParams={{ options, setOptions }}
                correctAnswerParams={{ correctAnswer, setCorrectAnswer }}
                activeSectionParams={{ activeSection, setActiveSection }}
              />
            )}

            {/* Subjective Questions */}
            {activeSection && activeSection[0] === "subjective" && (
              <QuestionForm
                formType="subjective"
                sectionParams={{ sections, setSections }}
                questionParams={{ question, setQuestion }}
                optionsParams={{ options, setOptions }}
                correctAnswerParams={{ correctAnswer, setCorrectAnswer }}
                activeSectionParams={{ activeSection, setActiveSection }}
              />
            )}

            {/* Theory Questions */}
            {activeSection && activeSection[0] === "theory" && (
              <QuestionForm
                formType="theory"
                sectionParams={{ sections, setSections }}
                questionParams={{ question, setQuestion }}
                optionsParams={{ options, setOptions }}
                correctAnswerParams={{ correctAnswer, setCorrectAnswer }}
                activeSectionParams={{ activeSection, setActiveSection }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-3/10 border rounded-md shadow-xl shadow-theme-gray-light/30 px-5 py-3">
            {/* Sidebar Heading */}
            <div className="font-semibold text-xl">Sections & Questions</div>

            {/* Sections */}
            <Accordion type="single" collapsible defaultValue="multiple_choice">
              {sections
                ? sections.map((section, sectionkey) => {
                    return (
                      <AccordionItem value={section.type} key={sectionkey}>
                        <AccordionTrigger
                          onClick={() => {
                            setOptions([]);
                            setQuestion("");
                            setActiveSection([
                              section.type,
                              section.questions.length,
                            ]);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="text-sm">{section.title}</div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-wrap gap-2">
                            {section.questions.map((qst, qstkey) => (
                              <button
                                key={qstkey}
                                className={`h-6 w-6 rounded-md ${
                                  activeSection && qstkey == activeSection[1]
                                    ? "bg-accent/10 border border-accent text-accent"
                                    : "bg-accent hover:bg-accent-dim text-white"
                                }  cursor-pointer text-xs`}
                                onClick={() => {
                                  if (section.type == "multiple_choice") {
                                    setOptions(qst.options.map((q) => q.text));
                                    setCorrectAnswer(qst.correctAnswer);
                                  }

                                  if (section.type == "subjective") {
                                    setOptions(
                                      qst.answerSlots.map((item) =>
                                        item.possibleAnswers.join(",")
                                      )
                                    );
                                  }

                                  if (section.type == "theory") {
                                    setOptions([qst.expectedAnswer]);
                                  }

                                  setQuestion(qst.question);
                                  setActiveSection([section.type, qstkey]);
                                }}
                              >
                                {qstkey + 1}
                              </button>
                            ))}
                          </div>

                          {/* Sidebar Options */}
                          <div className="w-full flex items-center gap-2 mt-2">
                            {/* Add a question */}
                            {section.questions.length < 60 && (
                              <button
                                className="w-5/10 h-6 text-xs flex items-center gap-2 text-accent cursor-pointer leading-none"
                                onClick={() => {
                                  setCorrectAnswer("A"); // Works for obj only
                                  setQuestion("");
                                  setOptions([]);
                                  setActiveSection([
                                    section.type,
                                    section.questions.length + 1,
                                  ]);
                                }}
                              >
                                <Plus size={12} />
                                <span>Add Question</span>
                              </button>
                            )}
                            {/* Delete Section */}
                            <button
                              className="grow flex items-center gap-2 text-xs   text-red-600 cursor-pointer "
                              onClick={() => deleteSection(section.type)}
                            >
                              <Trash2Icon size={12} />
                              <span>Delete Section</span>
                            </button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })
                : ""}
            </Accordion>
            <Spacer size="sm" />

            {/* Add Section Button */}
            <button
              className="text-sm flex items-center text-theme-gray hover:text-accent-dim gap-2 cursor-pointer"
              onClick={() => setShowSectionsModal(true)}
            >
              <span>Add a Section</span>
              <Plus size={14} />
            </button>

            {/* Submit Assessment */}
            {sections && sections?.length > 1 && (
              <button
                className="w-full rounded-md h-8 px-5 text-sm border border-emerald-600 mt-10 flex items-center justify-center text-emerald-600 cursor-pointer"
                type="button"
                onClick={submitAss}
              >
                <span>Submit Assessment</span>
                {loading !== "submitAss" ? (
                  <ArrowRight size={12} />
                ) : (
                  <Spinner className="size-4" />
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* Dialog modals */}
      {/* Dialog - Create Assessment */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>
              Please provide the following data
            </DialogDescription>
          </DialogHeader>

          <>
            {/* Form */}
            {courses && loading !== "page" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as typeof e.target & {
                    courseId: { value: string };
                    session: { value: string };
                    term: { value: string };
                    startDate: { value: string };
                    dueDate: { value: string };
                    instruction: { value: string };
                    totalMarks: { value: string };
                    status: { value: string };
                  };
                  setAssDetails({
                    title: courses.find(
                      (item) => item._id == target.courseId.value
                    )!.code,
                    course: target.courseId.value,
                    session: target.session.value,
                    term: target.term.value,
                    startDate: new Date(target.startDate.value).toISOString(),
                    dueDate: new Date(target.dueDate.value).toISOString(),
                    instruction: target.instruction.value,
                    status: target.status.value,
                    totalMarks: Number(target.totalMarks.value),
                    sections: [],
                  });

                  setShowDetailModal(false);
                }}
              >
                {/* Course id */}
                <Select name="courseId">
                  <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Select course</SelectLabel>
                      {courses.map((course) => (
                        <SelectItem
                          value={course._id}
                          key={course._id}
                        >{`${course.code} - ${course.title}`}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Spacer size="sm" />

                {/* Session and term */}
                <div className="flex items-center justify-between gap-2">
                  {/* Session */}
                  <Select name="session">
                    <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* Term */}
                  <Select name="term">
                    <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Term</SelectLabel>
                        <SelectItem value="1">First</SelectItem>
                        <SelectItem value="2">Second</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Spacer size="sm" />

                {/* Instructions */}
                <div>
                  <Input
                    name="instruction"
                    type="text"
                    placeholder="Assessment Instruction"
                    required
                  />
                </div>
                <Spacer size="sm" />

                {/* Total Marks and status */}
                <div className="flex items-center justify-between gap-2">
                  {/* Total Marks */}
                  <Input
                    name="totalMarks"
                    type="number"
                    placeholder="Total Marks"
                    required
                  />

                  {/* Status */}
                  <Select name="status" required>
                    <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Term</SelectLabel>
                        <SelectItem value="published">Publish Now</SelectItem>
                        <SelectItem value="draft">Save Draft</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Spacer size="sm" />

                {/* Dates */}
                <div className="flex items-center justify-between gap-2">
                  {/* Start */}
                  <div className="w-full">
                    <span className="text-xs text-theme-gray">Start</span>
                    <input
                      type="date"
                      name="startDate"
                      className="h-10 border rounded-md border-accent-light text-theme-gray text-sm w-full px-2 outline-none"
                      placeholder="Start Date"
                      required
                    />
                  </div>

                  {/* End */}
                  <div className="w-full">
                    <span className="text-xs text-theme-gray">End</span>
                    <input
                      type="date"
                      name="dueDate"
                      className="h-10 border rounded-md border-accent-light text-theme-gray text-sm w-full px-2 outline-none"
                      placeholder="Start Date"
                      required
                    />
                  </div>
                </div>
                <Spacer size="md" />

                <Button
                  title={"Proceed to Questions"}
                  loading={loading === "addAss"}
                  variant={"fill"}
                  icon={<Plus size={20} />}
                />
                <Spacer size="md" />
              </form>
            ) : (
              ""
            )}

            {/* Loading screen */}
            {loading === "page" && !courses ? (
              <div className="w-full flex flex-col items-center border rounded-md p-10">
                <Spinner className="size-6 text-theme-gray" />
                <Spacer size="sm" />
                <div className="text-theme-gray tex-xl">Fetching Courses</div>
              </div>
            ) : (
              ""
            )}

            {/* Error Screen */}
            {loading === "pageError" && !courses ? (
              <div className="w-full flex flex-col items-center border rounded-md p-10">
                <RefreshCcw size={48} className="text-theme-gray" />
                <Spacer size="sm" />
                <div className="text-theme-gray tex-xl">
                  An error occured please refresh page
                </div>
              </div>
            ) : (
              ""
            )}
          </>
        </DialogContent>
      </Dialog>

      {/* Dialog - Create Sections */}
      <Dialog open={showSectionsModal} onOpenChange={setShowSectionsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Section Details</DialogTitle>
            <DialogDescription>
              To create questions you must first add a section
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e: React.SyntheticEvent) => {
              e.preventDefault();
              const target = e.target as typeof e.target & {
                sectionType: { value: string };
                sectionTitle: { value: string };
                sectionInstructions: { value: string };
                score: { value: string };
              };

              const newSection = {
                type: target.sectionType.value,
                title: target.sectionTitle.value,
                instruction: target.sectionInstructions.value,
                defaultQuestionScore: Number(target.score.value),
                questions: [],
              };

              setSections((prev) =>
                prev ? [...prev, newSection] : [newSection]
              );

              setShowSectionsModal(false);
              setActiveSection([target.sectionType.value, 0]);
              setQuestion("");
              setOptions([]);
              setCorrectAnswer("A");
            }}
          >
            {/* Section Title */}
            <Input
              name={"sectionTitle"}
              type={"text"}
              placeholder={"Section Title"}
            />
            <Spacer size="sm" />

            <div className="flex items-center gap-2">
              {/* Section Type */}
              <Select name="sectionType" required>
                <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                  <SelectValue placeholder="Section Type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { name: "Objective", type: "multiple_choice" },
                    { name: "Subjective", type: "subjective" },
                    { name: "Theory", type: "theory" },
                  ].map((sect, key) => {
                    if (!sections) return;
                    if (sections.find((sectx) => sectx.type === sect.type)) {
                      return;
                    }

                    return (
                      <SelectItem value={sect.type} key={key}>
                        {sect.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Enter Score */}
              <Input
                name="score"
                type="number"
                placeholder="Each Question's Score"
                required
              />
            </div>

            <Spacer size="sm" />

            {/* Section Instructions */}
            <Input
              name={"sectionInstructions"}
              type={"text"}
              placeholder={"Section Description"}
              required
            />
            <Spacer size="sm" />

            <Button
              title={"Create Section"}
              loading={loading === "addAss"}
              variant={"fill"}
              icon={<Plus size={20} />}
            />
            <Spacer size="md" />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const QuestionForm = ({
  formType,
  sectionParams,
  questionParams,
  optionsParams,
  correctAnswerParams,
  activeSectionParams,
}: QuestionFormType) => {
  const { sections, setSections } = sectionParams;
  const { question, setQuestion } = questionParams;
  const { options, setOptions } = optionsParams;
  const { correctAnswer, setCorrectAnswer } = correctAnswerParams;
  const { activeSection, setActiveSection } = activeSectionParams;

  const addQuestion = (e: React.SyntheticEvent) => {
    e.preventDefault();
    let formatedQuestion: any;

    // Check for important state dependencies
    if (!sections) return;
    if (!activeSection) return;

    // Initialzie a shortcut for refferencing the target section
    const targetSection = sections.find((item) => item.type === formType);

    // Letter mapping for objective sections
    const opt: any = { 0: "A", 1: "B", 2: "C", 3: "D" };

    // Arrange formdata for objective
    if (formType === "multiple_choice")
      formatedQuestion = {
        question: question,
        type: "multiple_choice",
        score: targetSection?.defaultQuestionScore || 1,
        options: options.map((item, key) => {
          return { label: opt[`${key}`], text: item };
        }),
        correctAnswer: correctAnswer as string,
      };

    // Arrange formdata for subjective
    if (formType === "subjective")
      formatedQuestion = {
        question: question,
        type: formType,
        score: targetSection?.defaultQuestionScore || 1,
        answerSlots: options.map((item, key) => {
          return { slotNumber: key + 1, possibleAnswers: item.split(",") };
        }),
      };

    // Arrange formdata for subjective
    if (formType === "theory")
      formatedQuestion = {
        question: question,
        type: formType,
        score: targetSection?.defaultQuestionScore || 1,
        expectedAnswer: options[0],
        requiresManualMarking: true,
      };

    // Check if update is the correct action to execute
    let needsUpdate;
    if (targetSection && activeSection) {
      needsUpdate = (targetSection.questions?.length ?? 0) > activeSection[1];
    }

    // If question exist, then update it
    if (needsUpdate) {
      console.log("No active section, logic error.");

      setSections((prev) =>
        prev
          ? prev.map((sect) => {
              if (sect.type == formType) {
                sect.questions[activeSection[1]] = formatedQuestion;
              }

              return sect;
            })
          : prev
      );

      return;
    }

    // Check if questions are upto 60 before adding
    if (targetSection && targetSection?.questions.length > 59) {
      return;
    }
    // Else - Question is new so push to end of questions array
    setSections((prev) =>
      prev
        ? prev.map((sect) => {
            // Spread the previous section to avoid mutation
            let newSect = { ...sect };

            // Check if iterator is currently on the target section
            if (newSect.type == formType) {
              newSect.questions = [...newSect.questions, formatedQuestion];
            }

            return newSect;
          })
        : prev
    );

    // Reset form only when questions are less than 60
    if (targetSection && targetSection.questions.length < 60) {
      setCorrectAnswer("A");
      setQuestion("");
      setOptions([]);
      setActiveSection([formType, activeSection[1] + 1]);
    }
  };

  const deleteQuestion = () => {
    setSections((prev) =>
      prev!.map((sect) => {
        if (sect.type === formType) {
          return {
            ...sect,
            questions: sect.questions.filter(
              (_, index) => index !== activeSection![1]
            ),
          };
        }

        return sect;
      })
    );

    setQuestion("");
    setOptions([]);
    setCorrectAnswer("A");
    setActiveSection([
      formType,
      sections!.find((sect) => sect.type === formType)!.questions.length - 1,
    ]);
  };

  return (
    <form onSubmit={addQuestion}>
      {/* Questions Heading*/}
      <div className="font-semibold">
        {sections?.map((sect) => {
          if (sect.type !== formType) return "";
          if (sect.questions && sect.questions.length - 1 < activeSection![1])
            return "New Question";
          return "Question " + (activeSection![1] + 1);
        })}
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
              formType !== "theory" ? "border-r" : ""
            } pr-2`}
          >
            {formType !== "theory" ? "Options" : "Expected Answer"}
          </div>

          {/* Objective Option Add Button */}
          {activeSection && activeSection[0] !== "theory" && (
            <>
              {/* Add button */}
              <button
                className="text-sm text-accent cursor-pointer leading-none border-r pr-2"
                type="button"
                onClick={() =>
                  setOptions((prev) => {
                    // Allow only 4 objectives
                    if (prev.length > 3) return prev;
                    return [...prev, ""];
                  })
                }
              >
                Add answer option
              </button>

              {/* Clear all button */}
              <button
                className="text-sm text-theme-error cursor-pointer leading-none"
                type="button"
                onClick={() => setOptions([])}
              >
                Clear All Options
              </button>
            </>
          )}
        </div>

        {formType === "multiple_choice" && options.length > 0 && (
          <div className="text-sm text-theme-success">
            Corect Answer: {correctAnswer || "Nill"}
          </div>
        )}
      </div>
      <Spacer size="sm" />

      {/* Options */}
      <div className="w-full flex">
        {/* Objective Radio Buttons */}
        {activeSection &&
          activeSection[0] == "multiple_choice" &&
          options.length > 0 && (
            <div className="w-fit">
              <RadioGroup
                value={correctAnswer}
                className="gap-0"
                onValueChange={(val: string) => {
                  console.log(val);
                  setCorrectAnswer(val);
                }}
              >
                {options.map((_, key) => {
                  const opt: any = { 0: "A", 1: "B", 2: "C", 3: "D" };
                  return (
                    <div className="flex items-center h-10 mb-1" key={key}>
                      <RadioGroupItem
                        value={opt[`${key}`]}
                        id={`R${key + 1}`}
                      />
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

        {/* Options Main */}
        <div className="grow">
          {formType !== "theory" &&
            options.map((option, key) => {
              const objLabels = ["A", "B", "C", "D"];

              return (
                <div className="flex items-center mb-1" key={key}>
                  {/* Labels for Obj & Sub only */}
                  {formType !== "theory" && (
                    <div
                      className={`h-full flex items-center text-sm font-semibold ${
                        formType === "multiple_choice"
                          ? "w-14 justify-center"
                          : "w-20"
                      }`}
                    >
                      {formType === "multiple_choice"
                        ? objLabels[key]
                        : `Slot ` + (key + 1)}
                    </div>
                  )}

                  {/* Text Box */}
                  <Input
                    name={`option-${key + 1}`}
                    type={"text"}
                    placeholder={
                      formType == "multiple_choice"
                        ? "Enter an option"
                        : formType == "subjective"
                        ? "Ans 1, Ans 2, Ans 3"
                        : "Enter an answer"
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

                  {/* Delete a Question */}
                  <button
                    className="h-10 w-10 hover:text-theme-error flex items-center justify-center cursor-pointer"
                    type="button"
                    onClick={() => {
                      setOptions((opts) => opts.filter((_, i) => i !== key));
                      setCorrectAnswer("A");
                    }}
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              );
            })}

          {/* Theory text input */}
          {formType === "theory" && (
            <div className="flex items-center mb-1">
              {/* Text Box */}
              <Input
                name={`expectedAnswer`}
                type={"text"}
                placeholder={"Enter expected answer"}
                value={options[0] || ""}
                onChange={(e) => setOptions([e.target.value])}
                required
              />
            </div>
          )}
        </div>
      </div>
      <Spacer size="sm" />

      {/* Submit & Delete Button */}
      <div className="flex gap-2">
        {/* Submit Question */}
        <div className="w-42">
          <Button
            title={
              sections &&
              activeSection &&
              (sections.find((sct) => sct.type == formType)?.questions.length ??
                0) > activeSection[1]
                ? "Update Question"
                : "Add Question"
            }
            loading={false}
            variant={"fill"}
          />
        </div>

        {/* Delete Question */}
        {sections &&
          activeSection &&
          (sections.find((sct) => sct.type === formType)?.questions.length ??
            0) > activeSection[1] && (
            <div className="w-42">
              <Button
                title={"Delete Question"}
                loading={false}
                variant={"fillError"}
                onClick={deleteQuestion}
              />
            </div>
          )}
      </div>
    </form>
  );
};

const Page = () => {
  return (
    <SessionProvider>
      <Main />
    </SessionProvider>
  );
};

export default Page;
