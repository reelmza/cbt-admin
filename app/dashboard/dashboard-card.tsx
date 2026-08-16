"use client";

import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CardData } from "./use-card-data";

type Skeleton = "stat" | "chart" | "list" | "stat-list";

const Bone = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn("rounded-md bg-theme-gray-light animate-pulse", className)}
    style={style}
  />
);

/* Placeholders trace the shape of the content they stand in for, so the card
 * does not jump around once the data lands */
const CardSkeleton = ({ variant }: { variant: Skeleton }) => {
  if (variant === "chart") {
    return (
      <div className="h-48 w-full flex items-end gap-3">
        {[62, 88, 45, 74, 38].map((height, key) => (
          <Bone
            key={key}
            className="flex-1 rounded-b-none"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-4 py-1">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <Bone className="h-2.5 w-24" />
              <Bone className="h-2.5 w-6" />
            </div>
            <Bone className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Bone className="h-7 w-20" />
      <Bone className="h-3 w-28" />

      {variant === "stat-list" && (
        <div className="flex flex-col gap-3 mt-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Bone className="h-2.5 w-full" />
              <Bone className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const DashboardCard = ({
  title,
  subtitle,
  icon,
  state,
  empty,
  skeleton = "stat",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  state: CardData<any>;
  // The card decides what "nothing to show" means for its own payload
  empty?: boolean;
  skeleton?: Skeleton;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("border rounded-xl bg-white p-5 flex flex-col", className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex items-start gap-3">
        <div className="shrink-0 size-8 rounded-xl bg-accent-light text-accent flex items-center justify-center">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-accent-dim">{title}</div>
          {subtitle ? (
            <div className="text-xs text-theme-gray mt-0.5 truncate">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        title="Refresh"
        onClick={state.reload}
        disabled={state.loading}
        className="shrink-0 text-theme-gray hover:text-accent transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
      >
        <RefreshCw size={14} />
      </button>
    </div>

    <div className="grow flex flex-col justify-center pt-4">
      {state.loading ? (
        <CardSkeleton variant={skeleton} />
      ) : state.failed ? (
        <div className="h-24 flex flex-col items-center justify-center gap-2.5">
          <div className="text-xs text-theme-gray">
            Couldn&apos;t load this card.
          </div>
          <button
            type="button"
            onClick={state.reload}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs text-theme-gray hover:text-accent hover:border-theme-gray-dim transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      ) : !state.data || empty ? (
        <div className="h-24 flex items-center justify-center text-xs text-theme-gray">
          No data available
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export const Hero = ({
  value,
  caption,
}: {
  value: string | number;
  caption: string;
}) => (
  <div>
    <div className="text-3xl font-bold text-accent-dim tabular-nums leading-none">
      {value}
    </div>
    <div className="text-xs text-theme-gray mt-1.5">{caption}</div>
  </div>
);

const ChartTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-white px-3 py-2 shadow-sm">
      <div className="text-xs text-theme-gray">{label}</div>
      <div className="text-sm font-medium text-accent-dim tabular-nums">
        {payload[0].value} {unit}
      </div>
    </div>
  );
};

/*
 * One measure across a handful of named categories. Single series, so the title
 * names it and no legend is needed; the grid and axes stay recessive so the
 * bars carry the reading.
 */
export const ColumnChart = ({
  items,
  unit,
  empty,
}: {
  items: { label: string; value: number }[];
  unit: string;
  empty: string;
}) => {
  if (items.length === 0) {
    return <div className="text-xs text-theme-gray">{empty}</div>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={items}
          margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke="var(--theme-gray-light)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--theme-gray)" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={40}
            tick={{ fontSize: 11, fill: "var(--theme-gray)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--theme-gray-light)", opacity: 0.5 }}
            content={<ChartTooltip unit={unit} />}
          />
          <Bar
            dataKey="value"
            fill="var(--accent)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/*
 * One measure across a handful of categories. Every bar carries its own name and
 * value, so colour is only ever a second read of what the labels already say.
 */
export const BarList = ({
  items,
  empty,
}: {
  items: { label: string; value: number; color?: string }[];
  empty: string;
}) => {
  if (items.length === 0) {
    return <div className="text-xs text-theme-gray">{empty}</div>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} title={`${item.label}: ${item.value}`}>
          <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
            <span className="text-theme-gray capitalize truncate">
              {item.label}
            </span>
            <span className="text-accent-dim font-medium tabular-nums shrink-0">
              {item.value}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-theme-gray-light">
            <div
              className={cn("h-full rounded-full", item.color ?? "bg-accent")}
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
