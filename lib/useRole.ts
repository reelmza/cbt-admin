"use client";

import { useSession } from "next-auth/react";
import { ROLES, type Role } from "./access";

export { ROLES };
export type { Role };

export const useRole = () => {
  const { data: session, status } = useSession();
  const role = session?.user?.role as Role | undefined;

  return {
    role,
    userId: session?.user?.id,
    loading: status === "loading",
    is: (...roles: Role[]) => !!role && roles.includes(role),
    isSuperadmin: role === ROLES.superadmin,
    isAdmin: role === ROLES.admin,
    isLecturer: role === ROLES.lecturer,
    isInvigilator: role === ROLES.invigilator,
    isExamOfficer: role === ROLES.examOfficer,
  };
};
