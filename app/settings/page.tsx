"use client";

import AppearanceSetting from "@/components/settings/AppearanceSetting";
import ExamSetting from "@/components/settings/ExamSetting";
import GeneralSetting from "@/components/settings/GeneralSetting";
import NotificationSetting from "@/components/settings/NotificationSetting";
import SecuritySetting from "@/components/settings/SecuritySetting";
import Preload from "@/components/preload";
import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";

type SettingKey =
  | "general"
  | "exams"
  | "appearance"
  | "security"
  | "notifications";

const navItems: { key: SettingKey; label: string }[] = [
  { key: "general", label: "General" },
  // { key: "exams", label: "Exams" },
  { key: "appearance", label: "Appearance" },
  { key: "security", label: "Security" },
  // { key: "notifications", label: "Notifications" },
];

const contentMap: Record<SettingKey, React.ReactNode> = {
  general: <GeneralSetting />,
  exams: <ExamSetting />,
  appearance: <AppearanceSetting />,
  security: <SecuritySetting />,
  notifications: <NotificationSetting />,
};

const Page = () => {
  const [active, setActive] = useState<SettingKey>("general");
  const { data: session } = useSession();

  if (!session) return null;

  if (session.user.role !== "superadmin") {
    return (
      <Preload
        loading="pageError"
        pageData={false}
        errorMessage="Access Denied$You are not authorized to manage settings"
      />
    );
  }

  return (
    <div className="w-full h-full font-sans flex">
      {/* Settings Sidebar */}
      <div className="w-[25%] shrink-0 border-r h-full py-10 px-4">
        <div className="text-xs font-semibold text-theme-gray uppercase tracking-widest mb-4 px-2">
          Settings
        </div>

        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-2.5 h-9 px-2 rounded-md text-sm cursor-pointer transition-colors ${
                  active === item.key
                    ? "bg-accent-light text-accent font-semibold"
                    : "text-theme-gray hover:bg-theme-gray-light"
                }`}
              >
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Settings Content */}
      <div className="grow overflow-y-auto p-10">{contentMap[active]}</div>
    </div>
  );
};

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};
export default PageWrapper;
