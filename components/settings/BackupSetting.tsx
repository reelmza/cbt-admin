"use client";

import Button from "@/components/button";
import Spacer from "@/components/spacer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attachHeaders, localAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

const COLLECTIONS = [
  { id: "assessments", label: "Assessments" },
  { id: "students", label: "Students" },
  { id: "courses", label: "Courses" },
  { id: "groups", label: "Groups" },
  { id: "questions", label: "Questions" },
  { id: "users", label: "Users" },
  { id: "config", label: "Config" },
];

const BackupSetting = () => {
  const { data: session } = useSession();
  const [collection, setCollection] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const sync = async () => {
    if (!collection) {
      toast.error("Select a collection to sync.", toastConfig);
      return;
    }

    setLoading(true);
    try {
      attachHeaders(session!.user.token);
      await localAxios.post(`/config/admin/sync/${collection}`);
      toast.success(`"${collection}" synced successfully.`, toastConfig);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || `Failed to sync "${collection}".`,
        toastConfig,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Backup & Sync</div>
      <div className="text-sm text-theme-gray mb-6">
        Sync a database collection to the backup store.
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-sm font-medium mb-4">Sync Collection</div>

        <div className="text-xs text-theme-gray mb-1">Collection</div>
        <Select value={collection} onValueChange={setCollection}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a collection…" />
          </SelectTrigger>
          <SelectContent>
            {COLLECTIONS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Spacer size="md" />

        <div className="w-32">
          <Button
            title="Sync"
            loading={loading}
            variant="fill"
            type="button"
            onClick={sync}
          />
        </div>
      </div>
    </div>
  );
};

export default BackupSetting;
