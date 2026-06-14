"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { Pencil, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const { data: session } = useSession();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditSubGroup, setShowEditSubGroup] = useState(false);
  const [editSubGroup, setEditSubGroup] = useState<SubGroupType | null>(null);
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<SubGroupType[] | null>(null);
  const [rawData, setRawData] = useState<GroupType[] | null>(null);

  const addGroup = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      groupCode: { value: string };
      groupName: { value: string };
      groupDescription: { value: string };
      group: { value: string };
    };

    setLoading("addGroup");
    try {
      const api = await getAxios();
      const res = await api.post("admin/create-subgroup", {
        code: target.groupCode.value,
        name: target.groupName.value,
        description: target.groupDescription.value,
        group: target.group.value,
        school: session?.user.id,
      });

      if (res.status === 201) {
        setLoading(null);
        setShowCreateGroup(false);
        setPageData((prev) => {
          if (!prev) return prev;
          return [...prev, res.data.data];
        });
        toast.success("Department has been added successfully.", toastConfig);
      }
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  const editSubGroupFn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editSubGroup) return;

    const target = e.target as typeof e.target & {
      groupCode: { value: string };
      groupName: { value: string };
      groupDescription: { value: string };
    };

    setLoading("editSubGroup");
    try {
      const api = await getAxios();
      const res = await api.patch(
        `/school/subgroup/${editSubGroup._id}`,
        {
          code: target.groupCode.value,
          name: target.groupName.value,
          description: target.groupDescription.value,
        },
      );

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev
            ? prev.map((sg) =>
                sg._id === editSubGroup._id
                  ? { ...sg, ...res.data.data }
                  : sg,
              )
            : prev,
        );
        setShowEditSubGroup(false);
        setEditSubGroup(null);
        toast.success("Department updated successfully.", toastConfig);
      }

      setLoading(null);
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getGroups = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/admin/groups", {
          signal: controller.signal,
        });

        if (res.status === 200) {
          const data: any = [];

          res.data.data.forEach((grp: any) => {
            if (!grp.subGroups) return;
            data.push(...grp.subGroups);
          });
          setPageData(data);
          setRawData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getGroups();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="flex items-center justify-between">
            <div className="w-10"></div>
            <div className="block w-52">
              <Button
                title={"Create Department"}
                loading={false}
                variant={"fill"}
                icon={<Plus size={16} />}
                onClick={() => setShowCreateGroup(true)}
              />
            </div>
          </div>

          <Spacer size="lg" />

          {/* Table Header */}
          <div className="h-10 grid grid-cols-12 bg-accent-light font-medium text-accent rounded-xs">
            {[
              { label: "Code", span: "col-span-2" },
              { label: "Department Name", span: "col-span-3" },
              { label: "Description", span: "col-span-2" },
              { label: "Faculty", span: "col-span-3" },
              { label: "Created", span: "col-span-1" },
              { label: "", span: "col-span-1" },
            ].map((col, i, arr) => (
              <div
                key={i}
                className={`h-full flex items-center pl-2 text-sm leading-none ${col.span} ${i < arr.length - 1 ? "border-r border-accent-mid" : ""}`}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          {pageData.map((item) => (
            <div
              key={item._id}
              className="h-12 grid grid-cols-12 border-b border-theme-gray-mid hover:bg-theme-gray-light/20 cursor-default"
            >
              <div className="h-full flex items-center pl-2 text-sm text-theme-gray col-span-2">
                {item.code}
              </div>
              <div className="h-full flex items-center pl-2 text-sm text-theme-gray col-span-3">
                {item.name}
              </div>
              <div className="h-full flex items-center pl-2 text-sm text-theme-gray col-span-2">
                {item.description || "-"}
              </div>
              <div className="h-full flex items-center pl-2 text-sm text-theme-gray col-span-3">
                {rawData?.find((grp) => grp._id === item.group)?.name || ""}
              </div>
              <div className="h-full flex items-center pl-2 text-sm text-theme-gray col-span-1">
                {prettyDate(item.createdAt.split("T")[0])}
              </div>
              <div className="h-full flex items-center pl-2 col-span-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditSubGroup(item);
                    setShowEditSubGroup(true);
                  }}
                  className="text-theme-gray hover:text-accent cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          ))}

          <Spacer size="xl" />

          {/* Dialog - Create Department */}
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a department</DialogTitle>
                <DialogDescription className="pr-28">
                  Add a new sub group
                </DialogDescription>
              </DialogHeader>

              <form className="pr-28" onSubmit={addGroup}>
                <Input
                  name="groupCode"
                  type="text"
                  placeholder={"Department code"}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupName"
                  type="text"
                  placeholder={"Department name"}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupDescription"
                  type="text"
                  placeholder={"Brief description or identifier"}
                  required
                />
                <Spacer size="sm" />

                <Select name="group" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawData &&
                      rawData.map((grp, key) => (
                        <SelectItem value={grp._id} key={key}>
                          {grp.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Spacer size="md" />

                <Button
                  title={"Add Department"}
                  loading={loading === "addGroup"}
                  variant={"fill"}
                  icon={<Plus size={20} />}
                />

                <Spacer size="md" />
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog - Edit Department */}
          <Dialog
            open={showEditSubGroup}
            onOpenChange={(open) => {
              setShowEditSubGroup(open);
              if (!open) setEditSubGroup(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription className="pr-28">
                  Update the department details below
                </DialogDescription>
              </DialogHeader>

              <form
                key={editSubGroup?._id}
                className="pr-28"
                onSubmit={editSubGroupFn}
              >
                <Input
                  name="groupCode"
                  type="text"
                  placeholder={"Department code"}
                  defaultValue={editSubGroup?.code ?? ""}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupName"
                  type="text"
                  placeholder={"Department name"}
                  defaultValue={editSubGroup?.name ?? ""}
                  required
                />
                <Spacer size="sm" />

                <Button
                  title={"Save Changes"}
                  loading={loading === "editSubGroup"}
                  variant={"fill"}
                />

                <Spacer size="md" />
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
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
