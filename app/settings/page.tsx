"use client";

import AppearanceSetting from "@/components/settings/AppearanceSetting";
import BackupSetting from "@/components/settings/BackupSetting";
import DatabaseSetting from "@/components/settings/DatabaseSetting";
import ExamSetting from "@/components/settings/ExamSetting";
import GeneralSetting from "@/components/settings/GeneralSetting";
import NotificationSetting from "@/components/settings/NotificationSetting";
import SecuritySetting from "@/components/settings/SecuritySetting";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import { useEffect, useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";

type SettingKey =
  | "general"
  | "exams"
  | "appearance"
  | "security"
  | "notifications"
  | "backup"
  | "database";

const navItems: { key: SettingKey; label: string }[] = [
  { key: "general", label: "General" },
  // { key: "exams", label: "Exams" },
  // { key: "appearance", label: "Appearance" },
  { key: "security", label: "Security" },
  // { key: "notifications", label: "Notifications" },
  { key: "backup", label: "Backup & Sync" },
];

/* Kept out of navItems on purpose — the database tab is only reachable through
 * the Ctrl + Shift + D shortcut below */
const databaseItem: { key: SettingKey; label: string } = {
  key: "database",
  label: "Database",
};

const contentMap: Record<SettingKey, React.ReactNode> = {
  general: <GeneralSetting />,
  exams: <ExamSetting />,
  appearance: <AppearanceSetting />,
  security: <SecuritySetting />,
  notifications: <NotificationSetting />,
  backup: <BackupSetting />,
  database: <DatabaseSetting />,
};

const Page = () => {
  const [active, setActive] = useState<SettingKey>("general");
  const [showDatabase, setShowDatabase] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // e.code, not e.key — Shift rewrites e.key on several layouts
      if (!e.ctrlKey || !e.shiftKey || e.code !== "KeyD") return;
      e.preventDefault();
      setShowDatabase(true);
      setActive("database");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const tabs = showDatabase ? [...navItems, databaseItem] : navItems;

  return (
    <div className="w-full h-full font-sans">
      {/* Heading & tabs — lifted out of the flow; the content below offsets for it */}
      <div className="fixed top-0 left-[20%] w-[80%] z-20 bg-background px-10 pt-5">
        <h1 className="text-xl font-serif font-bold text-accent-dim">
          Settings
        </h1>
        <Spacer size="sm" />

        <div className="h-10 w-full overflow-x-auto border-b border-theme-gray-light">
          <div className="h-full flex items-center pr-4 w-max">
            {tabs.map((item, key) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`flex items-center justify-center h-full text-sm ${
                  key > 0 ? "ml-6" : ""
                } py-2 shrink-0 ${
                  active === item.key
                    ? "border-b-3 text-accent"
                    : "border-none text-theme-gray hover:text-accent"
                } border-accent cursor-pointer`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Content */}
      {/* Clears the fixed header above: 20 top pad + 28 heading + 8 gap + 40 tabs */}
      <div className="px-10 pt-[120px] pb-5">{contentMap[active]}</div>
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
