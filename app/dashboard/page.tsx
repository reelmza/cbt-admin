"use client";
import Spacer from "@/components/spacer";

import { SessionProvider, useSession } from "next-auth/react";
import {
  ActivityCard,
  AssessmentStatusCard,
  AssessmentsStat,
  CatalogueStat,
  QuestionBanksCard,
  StudentLevelsCard,
  StudentsStat,
  useActivity,
  useAssessments,
  useCatalogue,
  useQuestionBanks,
  useStudents,
} from "./cards";

const Page = () => {
  const { data: session } = useSession();

  // Every request waits on the session, since each one carries the bearer token
  const ready = !!session?.user?.id;

  const students = useStudents(ready);
  const catalogue = useCatalogue(ready);
  const assessments = useAssessments(ready);
  const questionBanks = useQuestionBanks(ready);
  const activity = useActivity(ready);

  return (
    <div className="w-full h-full px-10 py-5 font-sans">
      <h1 className="text-xl font-serif font-bold text-accent-dim">
        Dashboard
      </h1>
      <div className="text-sm text-theme-gray mt-0.5">
        Welcome back, {session?.user?.fullName}
      </div>
      <Spacer size="lg" />

      {/* Counts */}
      <div className="grid grid-cols-12 gap-5">
        <StudentsStat state={students} className="col-span-4" />
        <CatalogueStat state={catalogue} className="col-span-4" />
        <AssessmentsStat state={assessments} className="col-span-4" />
      </div>
      <Spacer size="lg" />

      {/* Breakdowns — the level chart shares the student request above */}
      <div className="grid grid-cols-12 gap-5">
        <StudentLevelsCard state={students} className="col-span-4" />
        <AssessmentStatusCard state={assessments} className="col-span-4" />
        <QuestionBanksCard state={questionBanks} className="col-span-4" />
      </div>
      <Spacer size="lg" />

      {/* Activity */}
      <div className="grid grid-cols-12 gap-5">
        <ActivityCard state={activity} className="col-span-12" />
      </div>

      <Spacer size="xl" />
      <Spacer size="xl" />
    </div>
  );
};

const Dashboard = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default Dashboard;
