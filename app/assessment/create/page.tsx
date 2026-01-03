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
  DialogTrigger,
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
import { Plus, RefreshCcw, Trash2Icon, X } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

// Types
type SectionType = {
  title: string;
  type: string;
  instructions: string;
  questions: {
    question: string;
    type: string;
    score: number;
    options: { label: string; text: string }[];
    correctAnswer: string;
  }[];
};

type AssessmentType = {
  course: string;
  session: string;
  term: string;
  startDate: string;
  dueDate: string;
};

const Create = () => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [showDetailModal, setShowDetailModal] = useState(true);
  const [showSectionsModal, setShowSectionsModal] = useState(false);

  const [loading, setLoading] = useState<string | null>("page");
  const [courses, setCourses] = useState<
    { _id: string; code: string; title: string }[] | null
  >(null);
  const [assDetails, setAssDetails] = useState<AssessmentType | null>(null);
  const [activeSection, setActiveSection] = useState<null | string>(null);
  const [sections, setSections] = useState<SectionType[] | null>(null);

  useEffect(() => {
    if (!session) return;

    const getData = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/school/courses", {
          signal: controller.signal,
        });

        if (res.status === 201) {
          console.log(res);
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
    !courses && getData();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full flex p-10 font-sans">
      {assDetails && (
        <>
          {/* Main Bar */}
          <div className="w-7/10 pr-5">
            {/* Assessment Details */}
            <div className="w-fit">
              {/* Assesment title */}
              <div className="text-2xl font-bold text-accent">
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
                  <div>{assDetails?.dueDate}</div>
                </div>
                <div></div>
              </div>
            </div>
            <Spacer size="md" />

            {/* Questions */}
            {activeSection === "multiple_choice" && (
              <ObjQuestionForm sectionParams={{ sections, setSections }} />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-3/10 border rounded-md shadow-xl shadow-theme-gray-light/30 px-5 py-3">
            {/* Sidebar Heading */}
            <div className="font-semibold text-xl">Questions</div>

            {/* Sections */}
            <div>
              {sections &&
                sections.map((item, key) => {
                  return (
                    <div key={key}>
                      <div className="text-sm">{item.title}</div>
                    </div>
                  );
                })}
            </div>
            <Spacer size="sm" />

            <button
              className="text-sm flex items-center text-accent hover:text-accent-dim gap-2 cursor-pointer"
              onClick={() => setShowSectionsModal(true)}
            >
              <span>Add a Section</span>
              <Plus size={14} />
            </button>
          </div>
        </>
      )}

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
                  };
                  setAssDetails({
                    course: target.courseId.value,
                    session: target.session.value,
                    term: target.term.value,
                    startDate: target.startDate.value,
                    dueDate: target.dueDate.value,
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
              };

              setSections([
                {
                  type: target.sectionType.value,
                  title: target.sectionTitle.value,
                  instructions: target.sectionInstructions.value,
                  questions: [],
                },
              ]);

              setShowSectionsModal(false);
              setActiveSection(target.sectionType.value);
            }}
          >
            {/* Section Title */}
            <Input
              name={"sectionTitle"}
              type={"text"}
              placeholder={"Section Title"}
            />
            <Spacer size="sm" />

            {/* Section Type */}
            <Select name="sectionType" required>
              <SelectTrigger className="w-full min-h-10 shadow-none text-accent-dim border-accent-light">
                <SelectValue placeholder="Section Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Objective</SelectItem>
                <SelectItem value="subjective">Subjective</SelectItem>
                <SelectItem value="theory">Theory</SelectItem>
              </SelectContent>
            </Select>
            <Spacer size="sm" />

            {/* Section Instructions */}
            <Input
              name={"sectionInstructions"}
              type={"text"}
              placeholder={"Section Description"}
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

const Page = () => {
  return (
    <SessionProvider>
      <Create />
    </SessionProvider>
  );
};

const ObjQuestionForm = ({
  sectionParams,
}: {
  sectionParams: {
    sections: SectionType[] | null;
    setSections: Dispatch<SetStateAction<SectionType[] | null>>;
  };
}) => {
  const { sections, setSections } = sectionParams;
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>("A");

  const addQuestion = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const opt: any = { 0: "A", 1: "B", 2: "C", 3: "D" };

    let formatedQuestion = {
      question: question,
      type: "multiple_choice",
      score: 5,
      options: options.map((item, key) => {
        return { label: opt[`${key}`], text: item };
      }),
      correctAnswer,
    };

    setSections((prev) => {
      let newArr = [...prev];
      newArr
        .find((sect) => sect.type == "multiple_choice")
        .questions.push(formatedQuestion);

      console.log(newArr);
      return newArr;
    });
  };

  return (
    <form onSubmit={addQuestion}>
      {/* Questions */}
      <div className="font-semibold">Question</div>
      <Spacer size="sm" />
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
          <div className="font-semibold border-r pr-2">Options</div>
          <button
            className="text-sm text-accent cursor-pointer leading-none border-r pr-2"
            type="button"
            onClick={() =>
              setOptions((prev) => {
                if (prev.length > 3) return prev;
                return [...prev, ""];
              })
            }
          >
            Add an Option
          </button>

          <button
            className="text-sm text-theme-error cursor-pointer leading-none"
            type="button"
            onClick={() => setOptions([])}
          >
            Clear All Options
          </button>
        </div>

        {options.length > 0 && (
          <div className="text-sm text-theme-success">
            Corect Answer: {correctAnswer || "Nill"}
          </div>
        )}
      </div>
      <Spacer size="sm" />

      {/* Options */}
      <div className="w-full flex">
        {/* Options Radio */}
        {options.length > 0 && (
          <div className="w-10">
            <RadioGroup
              value={correctAnswer}
              className="gap-0"
              onValueChange={(val: string) => {
                console.log(val);
                setCorrectAnswer(val);
              }}
            >
              {options.map((item, key) => {
                const opt: any = { 0: "A", 1: "B", 2: "C", 3: "D" };
                return (
                  <div
                    className="flex items-center justify-center h-10 mb-1"
                    key={key}
                  >
                    <RadioGroupItem value={opt[`${key}`]} id={`R${key + 1}`} />
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {/* Options Main */}
        <div className="grow">
          {options.map((option, key) => {
            return (
              <div className="flex items-center mb-1" key={key}>
                {/* Label */}
                <div className="h-full w-10 flex items-center justify-center text-sm font-semibold">
                  {key == 0 && "A"}
                  {key == 1 && "B"}
                  {key == 2 && "C"}
                  {key == 3 && "D"}
                </div>

                {/* Text Box */}
                <Input
                  name={`option-${key + 1}`}
                  type={"text"}
                  placeholder={"Enter an option"}
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) => {
                      let newArr = [...prev];

                      if (newArr.length < 1) {
                        newArr.push(e.target.value);
                        return newArr;
                      }

                      newArr[key] = e.target.value;
                      console.log(newArr);

                      return [...newArr];
                    })
                  }
                />

                {/* Delete a Question */}
                <button
                  className="h-10 w-10 hover:text-theme-error flex items-center justify-center cursor-pointer"
                  type="button"
                  onClick={() =>
                    setOptions((prev) => {
                      const newArr = [
                        ...prev.slice(0, key),
                        ...prev.slice(key + 1, prev.length),
                      ];
                      setCorrectAnswer("A");
                      return newArr;
                    })
                  }
                >
                  <Trash2Icon size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Spacer size="sm" />

      {/* Submit Question */}
      <div className="w-42">
        <Button title={"Add Question"} loading={false} variant={"fill"} />
      </div>
    </form>
  );
};

export default Page;
