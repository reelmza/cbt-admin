"use client";

import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import {
  Building2,
  ChartColumn,
  History,
  Layers,
  ListChecks,
  NotebookPen,
  UsersRound,
} from "lucide-react";
import { BarList, ColumnChart, DashboardCard, Hero } from "./dashboard-card";
import { useCardData, type CardData } from "./use-card-data";

// /student/all pages at 20 by default; pull a wide page so the level split is
// drawn from everyone rather than the first screenful
const STUDENT_PAGE = 1000;

const ACTIVITY_ROWS = 7;
const BANK_ROWS = 3;

// Dirty data (stray levels, unexpected statuses) must not grow the chart without
// limit, so anything past this folds into a single "Other" bar
const MAX_BARS = 6;

const STATUS_BAR: Record<string, string> = {
  published: "bg-theme-success",
  ongoing: "bg-theme-info",
  closed: "bg-theme-warning",
  draft: "bg-theme-gray",
};

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);

const asCount = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/* Counts each value, most frequent first */
const tally = (values: string[]): [string, number][] => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const capped = (pairs: [string, number][]): [string, number][] => {
  if (pairs.length <= MAX_BARS) return pairs;

  const head = pairs.slice(0, MAX_BARS - 1);
  const other = pairs
    .slice(MAX_BARS - 1)
    .reduce((sum, [, value]) => sum + value, 0);

  return [...head, ["Other", other]];
};

const dateLabel = (value: unknown) => {
  if (typeof value !== "string" || !value.includes("T")) return "—";
  return prettyDate(value.split("T")[0]) || "—";
};

/*
 * Four sources, six requests. A source can feed more than one card — the level
 * chart rides on the same payload as the student count — so nothing is fetched
 * twice, and a failure still only darkens the cards that depend on it.
 */

export type Students = {
  total: number;
  counted: number;
  levels: { label: string; value: number }[];
};

export const useStudents = (ready: boolean) =>
  useCardData<Students>(async (signal) => {
    const api = await getAxios();
    const res = await api.get(`/student/all?limit=${STUDENT_PAGE}`, { signal });
    const payload = res.data?.data ?? {};
    const students = asArray(payload.data);

    return {
      total: asCount(payload.totalItems, students.length),
      counted: students.length,
      levels: capped(
        tally(
          students.map((item) =>
            item?.level ? `${item.level} Level` : "No level",
          ),
        ),
      )
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, value]) => ({ label, value })),
    };
  }, ready);

export type Catalogue = {
  faculties: number;
  departments: number;
  courses: number;
};

export const useCatalogue = (ready: boolean) =>
  useCardData<Catalogue>(async (signal) => {
    const api = await getAxios();
    // One card, two endpoints — fetched together so the retry replays both
    const [groupRes, courseRes] = await Promise.all([
      api.get("/admin/groups", { signal }),
      api.get("/admin/courses", { signal }),
    ]);

    const groups = asArray(groupRes.data?.data);
    const courses = courseRes.data?.data ?? {};

    return {
      faculties: groups.length,
      departments: groups.reduce(
        (sum, group) => sum + asArray(group?.subGroups).length,
        0,
      ),
      courses: asCount(courses.coursesCount, asArray(courses.courses).length),
    };
  }, ready);

export type Assessments = {
  total: number;
  questions: number;
  live: number;
  statuses: { label: string; value: number; color: string }[];
};

export const useAssessments = (ready: boolean) =>
  useCardData<Assessments>(async (signal) => {
    const api = await getAxios();
    const res = await api.get("/admin/assessments", { signal });
    const payload = res.data?.data ?? {};
    const assessments = asArray(payload.assessments);

    return {
      total: asCount(payload.assessmentCount, assessments.length),
      questions: assessments.reduce(
        (sum, item) =>
          sum +
          asArray(item?.sections).reduce(
            (count, section) => count + asArray(section?.questions).length,
            0,
          ),
        0,
      ),
      live: assessments.filter(
        (item) => item?.authorizedToStart && !item?.endReason,
      ).length,
      statuses: capped(
        tally(assessments.map((item) => item?.status || "unknown")),
      ).map(([label, value]) => ({
        label,
        value,
        color: STATUS_BAR[label] ?? "bg-theme-gray",
      })),
    };
  }, ready);

export type QuestionBanks = {
  total: number;
  subjects: number;
  recent: { id: string; title: string; subject: string }[];
};

export const useQuestionBanks = (ready: boolean) =>
  useCardData<QuestionBanks>(async (signal) => {
    const api = await getAxios();
    const res = await api.get("/admin/question-banks", { signal });
    const payload = res.data?.data ?? {};
    const banks = asArray(payload.banks);

    return {
      total: asCount(payload.total, banks.length),
      subjects: new Set(banks.map((bank) => bank?.subject).filter(Boolean))
        .size,
      // Only ever the newest few; the count in the subtitle carries the rest
      recent: banks.slice(0, BANK_ROWS).map((bank, key) => ({
        id: bank?._id ?? `bank-${key}`,
        title: bank?.title || "Untitled bank",
        subject: bank?.subject || "No subject",
      })),
    };
  }, ready);

export type Activity = {
  total: number;
  logs: { id: string; actor: string; action: string; date: string }[];
};

export const useActivity = (ready: boolean) =>
  useCardData<Activity>(async (signal) => {
    const api = await getAxios();
    const res = await api.get(`/admin/audit-logs?limit=${ACTIVITY_ROWS}`, {
      signal,
    });
    const payload = res.data?.data ?? {};
    const logs = asArray(payload.logs);

    return {
      total: asCount(payload.total, logs.length),
      // The endpoint is asked for a page of ACTIVITY_ROWS, but slice anyway so a
      // server that ignores the limit cannot flood the card
      logs: logs.slice(0, ACTIVITY_ROWS).map((log, key) => ({
        id: log?._id ?? `log-${key}`,
        actor: log?.actor?.fullName || "System",
        action: [log?.action, log?.entity].filter(Boolean).join(" · ") || "—",
        date: dateLabel(log?.createdAt),
      })),
    };
  }, ready);

/* ---------- Row one: three counts ---------- */

export const StudentsStat = ({
  state,
  className,
}: {
  state: CardData<Students>;
  className?: string;
}) => (
  <DashboardCard
    title="Students"
    subtitle="Enrolled on the platform"
    icon={<UsersRound size={16} />}
    state={state}
    empty={state.data?.total === 0}
    className={className}
  >
    {state.data && <Hero value={state.data.total} caption="Total students" />}
  </DashboardCard>
);

export const CatalogueStat = ({
  state,
  className,
}: {
  state: CardData<Catalogue>;
  className?: string;
}) => (
  <DashboardCard
    title="Structure"
    subtitle="Faculties, departments and courses"
    icon={<Building2 size={16} />}
    state={state}
    empty={
      !!state.data &&
      state.data.faculties + state.data.departments + state.data.courses === 0
    }
    className={className}
  >
    {state.data && (
      <div className="flex items-end justify-between gap-4">
        <Hero value={state.data.faculties} caption="Faculties" />
        <Hero value={state.data.departments} caption="Departments" />
        <Hero value={state.data.courses} caption="Courses" />
      </div>
    )}
  </DashboardCard>
);

export const AssessmentsStat = ({
  state,
  className,
}: {
  state: CardData<Assessments>;
  className?: string;
}) => (
  <DashboardCard
    title="Assessments"
    subtitle={
      state.data
        ? `${state.data.questions} questions in total`
        : "Across every session"
    }
    icon={<NotebookPen size={16} />}
    state={state}
    empty={state.data?.total === 0}
    className={className}
  >
    {state.data && (
      <Hero
        value={state.data.total}
        caption={
          state.data.live > 0
            ? `${state.data.live} running right now`
            : "None running right now"
        }
      />
    )}
  </DashboardCard>
);

/* ---------- Row two: chart and breakdowns ---------- */

export const StudentLevelsCard = ({
  state,
  className,
}: {
  state: CardData<Students>;
  className?: string;
}) => (
  <DashboardCard
    title="Students by Level"
    subtitle={
      state.data && state.data.counted < state.data.total
        ? `First ${state.data.counted} of ${state.data.total} students`
        : "How enrolment splits across levels"
    }
    icon={<ChartColumn size={16} />}
    state={state}
    skeleton="chart"
    empty={state.data?.levels.length === 0}
    className={className}
  >
    {state.data && (
      <ColumnChart
        items={state.data.levels}
        unit="students"
        empty="No data available"
      />
    )}
  </DashboardCard>
);

export const AssessmentStatusCard = ({
  state,
  className,
}: {
  state: CardData<Assessments>;
  className?: string;
}) => (
  <DashboardCard
    title="Assessments by Status"
    subtitle="Where each assessment currently sits"
    icon={<ListChecks size={16} />}
    state={state}
    skeleton="list"
    empty={state.data?.statuses.length === 0}
    className={className}
  >
    {state.data && (
      <BarList items={state.data.statuses} empty="No data available" />
    )}
  </DashboardCard>
);

export const QuestionBanksCard = ({
  state,
  className,
}: {
  state: CardData<QuestionBanks>;
  className?: string;
}) => (
  <DashboardCard
    title="Question Banks"
    subtitle={
      state.data && state.data.total > BANK_ROWS
        ? `Newest ${state.data.recent.length} of ${state.data.total}`
        : `${state.data?.subjects ?? 0} subject${
            state.data?.subjects === 1 ? "" : "s"
          } covered`
    }
    icon={<Layers size={16} />}
    state={state}
    skeleton="stat-list"
    empty={state.data?.total === 0}
    className={className}
  >
    {state.data && (
      <>
        <Hero value={state.data.total} caption="Banks available" />

        {state.data.recent.length > 0 && (
          <div className="mt-4 flex flex-col divide-y divide-theme-gray-light">
            {state.data.recent.map((bank) => (
              <div key={bank.id} className="py-2 min-w-0">
                <div className="text-xs text-accent-dim truncate">
                  {bank.title}
                </div>
                <div className="text-xs text-theme-gray truncate">
                  {bank.subject}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </DashboardCard>
);

/* ---------- Row three: activity ---------- */

export const ActivityCard = ({
  state,
  className,
}: {
  state: CardData<Activity>;
  className?: string;
}) => (
  <DashboardCard
    title="Recent Activity"
    subtitle={
      state.data
        ? `Newest ${state.data.logs.length} of ${state.data.total} actions`
        : "Latest admin actions"
    }
    icon={<History size={16} />}
    state={state}
    skeleton="list"
    empty={state.data?.logs.length === 0}
    className={className}
  >
    {state.data && (
      <div className="flex flex-col divide-y divide-theme-gray-light">
        {state.data.logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between gap-3 py-2.5 text-xs"
          >
            <div className="min-w-0 truncate">
              <span className="text-accent-dim">{log.actor}</span>
              <span className="text-theme-gray"> {log.action}</span>
            </div>

            <span className="text-theme-gray shrink-0">{log.date}</span>
          </div>
        ))}
      </div>
    )}
  </DashboardCard>
);
