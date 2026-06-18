export type AuditAction =
  | "focus-lost"
  | "reconnect"
  | "create"
  | "update"
  | "pardon-applied";

export type AuditActor = {
  _id: string;
  email?: string;
  fullName: string;
  role: string;
};

export type AuditLog = {
  _id: string;
  actor: AuditActor | null;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  detail: string;
  ip?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export type AuditLogsMeta = {
  total: number;
  page: number;
  pages: number;
};
