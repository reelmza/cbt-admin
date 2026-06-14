"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import { Switch } from "@/components/ui/switch";
import { getAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { useState } from "react";
import { toast } from "sonner";

const SecuritySetting = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const changePassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      currentPassword: { value: string };
      newPassword: { value: string };
      confirmPassword: { value: string };
    };

    if (target.newPassword.value !== target.confirmPassword.value) {
      toast.error("New passwords do not match.", toastConfig);
      return;
    }

    setLoading("changePassword");
    try {
      const api = await getAxios();
      const res = await api.patch("/user/change-password", {
        oldPassword: target.currentPassword.value,
        newPassword: target.newPassword.value,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(
          res.data.message || "Password updated successfully.",
          toastConfig,
        );
        (e.target as HTMLFormElement).reset();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update password.",
        toastConfig,
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Security</div>
      <div className="text-sm text-theme-gray mb-6">
        Manage account security and access policies.
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-4">Change Password</div>

        <form onSubmit={changePassword}>
          <div className="text-xs text-theme-gray mb-1">Current Password</div>
          <Input
            name="currentPassword"
            type="password"
            placeholder="Enter current password"
            required
          />
          <Spacer size="sm" />

          <div className="text-xs text-theme-gray mb-1">New Password</div>
          <Input
            name="newPassword"
            type="password"
            placeholder="Enter new password"
            required
          />
          <Spacer size="sm" />

          <div className="text-xs text-theme-gray mb-1">
            Confirm New Password
          </div>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Repeat new password"
            required
          />
          <Spacer size="md" />

          <div className="w-40">
            <Button
              title="Update Password"
              loading={loading === "changePassword"}
              variant="fill"
            />
          </div>
        </form>
      </div>

      <div className="hidden border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-4">Session Policy</div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm">Force logout on inactivity</div>
            <div className="text-xs text-theme-gray">
              Ends sessions idle for more than 30 minutes
            </div>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm">Single session per account</div>
            <div className="text-xs text-theme-gray">
              Prevent concurrent logins from multiple devices
            </div>
          </div>
          <Switch />
        </div>
      </div>

      <div className="hidden border rounded-lg p-6">
        <div className="text-sm font-medium mb-1">Student Login Policy</div>
        <div className="text-xs text-theme-gray mb-4">
          Control how students authenticate
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm">
              Require password change on first login
            </div>
            <div className="text-xs text-theme-gray">
              Students must reset the default password
            </div>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm">Lock account after failed attempts</div>
            <div className="text-xs text-theme-gray">
              Locks after 5 consecutive wrong passwords
            </div>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  );
};

export default SecuritySetting;
