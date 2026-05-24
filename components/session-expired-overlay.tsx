"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import Button from "@/components/button";

const SessionExpiredOverlay = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-10 flex flex-col items-center gap-5 w-[380px]">
        <LogOut size={40} className="text-accent-dim" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-lg font-semibold text-accent-dim">
            Session Expired
          </div>
          <div className="text-sm text-theme-gray mt-1">
            Your session has timed out or expired. Please log out and sign in
            again.
          </div>
        </div>
        <div className="w-48">
          <Button
            title="Logout"
            variant="fill"
            loading={false}
            icon={<LogOut size={16} />}
            onClick={() => signOut({ redirectTo: "/" })}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredOverlay;
