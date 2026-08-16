"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { Pencil, Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRole } from "@/lib/useRole";

const Page = () => {
  const { data: session } = useSession();
  const { isSuperadmin } = useRole();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupType | null>(null);
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<GroupType[] | null>(null);

  const addGroup = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      groupCode: { value: string };
      groupName: { value: string };
      groupDescription: { value: string };
    };

    setLoading("addGroup");
    try {
      const api = await getAxios();
      const res = await api.post("admin/create-group", {
        code: target.groupCode.value,
        name: target.groupName.value,
        description: target.groupDescription.value,
        school: session?.user.id,
      });

      if (res.status === 201) {
        setLoading(null);
        setShowCreateGroup(false);
        setPageData((prev) => {
          if (!prev) return prev;
          return [...prev, res.data.data];
        });
        toast.success("Faculty has been added successfully.", toastConfig);
      }
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  const editGroupFn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editGroup) return;

    const target = e.target as typeof e.target & {
      groupCode: { value: string };
      groupName: { value: string };
      groupDescription: { value: string };
    };

    setLoading("editGroup");
    try {
      const api = await getAxios();
      const res = await api.patch(`/school/group/${editGroup._id}`, {
        code: target.groupCode.value,
        name: target.groupName.value,
        description: target.groupDescription.value,
      });

      if (res.status === 200 || res.status === 201) {
        setPageData((prev) =>
          prev
            ? prev.map((g) =>
                g._id === editGroup._id ? { ...g, ...res.data.data } : g,
              )
            : prev,
        );
        setShowEditGroup(false);
        setEditGroup(null);
        toast.success("Faculty updated successfully.", toastConfig);
      }

      setLoading(null);
    } catch (error) {
      console.log(error);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getGroups = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/admin/groups", {
          signal: controller.signal,
        });

        if (res.status === 200) {
          setPageData(res.data.data);
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
  }, [session?.user?.id]);

  return (
    <div className="w-full h-full px-10 py-5 font-sans">
      {pageData && (
        <>
          <h1 className="text-xl font-serif font-bold text-accent-dim">
            Faculties
          </h1>
          <Spacer size="sm" />

          <div className="flex items-center justify-between">
            <div className="w-10"></div>
            {isSuperadmin && (
              <div className="block w-52">
                <Button
                  title={"Create Faculty"}
                  loading={false}
                  variant={"fill"}
                  icon={<Plus size={16} />}
                  onClick={() => setShowCreateGroup(true)}
                />
              </div>
            )}
          </div>

          <Spacer size="lg" />

          <Table
            className={
              pageData.length === 0 ? "rounded-b-none border-b-0" : ""
            }
            tableHeading={[
              { value: "Faculty Code", colSpan: "col-span-2" },
              { value: "Faculty Name", colSpan: "col-span-3" },
              { value: "Description", colSpan: "col-span-3" },
              { value: "Depts.", colSpan: "col-span-1" },
              { value: "Created", colSpan: "col-span-2" },
              ...(isSuperadmin
                ? [{ value: "", colSpan: "col-span-1" }]
                : []),
            ]}
            tableData={pageData.map((item) => [
              { value: item.code, colSpan: "col-span-2" },
              { value: item.name, colSpan: "col-span-3" },
              { value: item.description, colSpan: "col-span-3" },
              { value: item.subGroups?.length, colSpan: "col-span-1" },
              {
                value: prettyDate(item.createdAt.split("T")[0]),
                colSpan: "col-span-2",
              },
              ...(isSuperadmin
                ? [
                    {
                      colSpan: "col-span-1",
                      render: () => (
                        <button
                          type="button"
                          onClick={() => {
                            setEditGroup(item);
                            setShowEditGroup(true);
                          }}
                          className="text-theme-gray hover:text-accent cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                      ),
                    },
                  ]
                : []),
            ])}
            showSearch={false}
            showOptions={false}
          />

          {pageData.length === 0 ? (
            <div className="border-x border-b rounded-b-xl bg-white h-20 flex items-center justify-center text-sm text-theme-gray">
              No faculties yet.
            </div>
          ) : (
            ""
          )}

          <Spacer size="xl" />

          {/* Dialog - Create Faculty */}
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new faculty</DialogTitle>
                <DialogDescription className="pr-28">
                  Enter relevant information below
                </DialogDescription>
              </DialogHeader>

              <form className="pr-28" onSubmit={addGroup}>
                <Input
                  name="groupCode"
                  type="text"
                  placeholder={"Faculty code"}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupName"
                  type="text"
                  placeholder={"Faculty name"}
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

                <Button
                  title={"Add Faculty"}
                  loading={loading === "addGroup"}
                  variant={"fill"}
                  icon={<Plus size={20} />}
                />

                <Spacer size="md" />
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog - Edit Faculty */}
          <Dialog
            open={showEditGroup}
            onOpenChange={(open) => {
              setShowEditGroup(open);
              if (!open) setEditGroup(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Faculty</DialogTitle>
                <DialogDescription className="pr-28">
                  Update the faculty details below
                </DialogDescription>
              </DialogHeader>

              <form
                key={editGroup?._id}
                className="pr-28"
                onSubmit={editGroupFn}
              >
                <Input
                  name="groupCode"
                  type="text"
                  placeholder={"Faculty code"}
                  defaultValue={editGroup?.code ?? ""}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupName"
                  type="text"
                  placeholder={"Faculty name"}
                  defaultValue={editGroup?.name ?? ""}
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="groupDescription"
                  type="text"
                  placeholder={"Brief description or identifier"}
                  defaultValue={editGroup?.description ?? ""}
                  required
                />
                <Spacer size="sm" />

                <Button
                  title={"Save Changes"}
                  loading={loading === "editGroup"}
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
