export const ROLES = {
  superadmin: "superadmin",
  admin: "admin",
  lecturer: "lecturer",
  invigilator: "invigilator",
  examOfficer: "examination_officer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/*
 * Which roles may open each area. The longest matching prefix wins, and any
 * path not listed here is open to every signed-in staff member.
 *
 * This is the single source of truth for navigation: the middleware enforces
 * it on every request and the sidebar reads it to decide what to show, so a
 * link can never appear for a role that would just be bounced back.
 *
 * A lecturer is deliberately absent from everything except /assessment — the
 * role exists to author assessments and their questions, nothing else. An
 * examination officer is the same, plus the question banks that feed them.
 */
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/assessment/archives", roles: ["superadmin"] },
  {
    prefix: "/assessment",
    roles: ["superadmin", "admin", "lecturer", "examination_officer"],
  },
  { prefix: "/dashboard", roles: ["superadmin", "admin", "invigilator"] },
  { prefix: "/users", roles: ["superadmin", "admin", "invigilator"] },
  { prefix: "/faculties", roles: ["superadmin", "admin", "invigilator"] },
  { prefix: "/courses", roles: ["superadmin", "admin", "invigilator"] },
  {
    prefix: "/question-banks",
    roles: ["superadmin", "admin", "examination_officer"],
  },
  { prefix: "/invigilator", roles: ["superadmin", "invigilator"] },
  { prefix: "/audit-logs", roles: ["superadmin"] },
  { prefix: "/settings", roles: ["superadmin"] },
];

const RULES = [...ROUTE_ROLES].sort(
  (a, b) => b.prefix.length - a.prefix.length,
);

export const canAccessRoute = (role: string | undefined, pathname: string) => {
  const rule = RULES.find(
    (item) =>
      pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );

  if (!rule) return true;
  return !!role && rule.roles.includes(role as Role);
};

/* Where a role starts after signing in, and where it is sent if it lands on an
 * area it may not open */
export const landingRoute = (role?: string | null) =>
  role === ROLES.lecturer || role === ROLES.examOfficer
    ? "/assessment"
    : "/dashboard";
