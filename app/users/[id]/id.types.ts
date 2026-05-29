export type StudentProfile = {
  fullName: string;
  regNumber: string;
  level: number;
  nin: string;
  email: string;
  phoneNumber: string;
  gender: string;
  accessCode: string;
  passportPhoto?: string;
  role: string;
  lastSync: string;
  deviceId: string | null;
  ipAddress: string | null;
  createdAt: string;
};
