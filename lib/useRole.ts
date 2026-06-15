"use client";

import { useSession } from "next-auth/react";

export const ROLES = {
  superadmin: "superadmin",
  admin: "admin",
  invigilator: "invigilator",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const useRole = () => {
  const { data: session, status } = useSession();
  const role = session?.user?.role as Role | undefined;

  return {
    role,
    loading: status === "loading",
    is: (...roles: Role[]) => !!role && roles.includes(role),
    isSuperadmin: role === ROLES.superadmin,
    isAdmin: role === ROLES.admin,
    isInvigilator: role === ROLES.invigilator,
  };
};
