"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
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
import { Spinner } from "@/components/ui/spinner";
import { attachHeaders, localAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { Group } from "next/dist/shared/lib/router/utils/route-regex";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
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
      const res = await localAxios.post("admin/create-subgroup", {
        code: target.groupCode.value,
        name: target.groupName.value,
        description: target.groupDescription.value,
        group: target.group.value,
        school: session?.user.id,
      });

      if (res.status === 200) {
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

  useEffect(() => {
    if (!session) return;

    const getGroups = async () => {
      try {
        attachHeaders(session!.user.token);
        const res = await localAxios.get("/admin/groups", {
          signal: controller.signal,
        });

        if (res.status === 201) {
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
        if (error.name !== "CanceledError") {
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
      <div className="flex items-center justify-between">
        <TableSearchBox placeholder="Search for a group" />

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

      <Table
        tableHeading={[
          { value: "Code", colSpan: "col-span-2" },
          { value: "Department Name", colSpan: "col-span-3" },
          { value: "Description", colSpan: "col-span-2" },

          { value: "Faculty", colSpan: "col-span-3" },
          { value: "Created", colSpan: "col-span-2" },
        ]}
        tableData={
          pageData
            ? pageData.map((item, key: number) => [
                {
                  value: `${item.code}`,
                  colSpan: "col-span-2",
                },

                { value: item.name, colSpan: "col-span-3" },
                { value: "-", colSpan: "col-span-2" },

                {
                  value:
                    rawData?.find((grp) => grp._id == item.group)?.name || "",
                  colSpan: "col-span-3",
                },

                {
                  value: prettyDate(item.createdAt.split("T")[0]),
                  colSpan: "col-span-2",
                },
              ])
            : []
        }
        showSearch={false}
        showOptions={false}
      />

      {/* Page Loading */}
      {loading === "page" ? (
        <div className="flex items-center gap-2 mt-2 text-theme-gray">
          <Spinner />
          <div className="text-sm">Fetching data</div>
        </div>
      ) : (
        ""
      )}

      <Spacer size="xl" />

      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a department</DialogTitle>
            <DialogDescription className="pr-28">
              Add a new sub group
            </DialogDescription>
          </DialogHeader>

          <form className="pr-28" onSubmit={addGroup}>
            {/* Course Code */}
            <Input
              name="groupCode"
              type="text"
              placeholder={"Department code"}
              required
            />
            <Spacer size="sm" />

            {/* Course name */}
            <Input
              name="groupName"
              type="text"
              placeholder={"Department name"}
              required
            />
            <Spacer size="sm" />

            {/* Course Description */}
            <Input
              name="groupDescription"
              type="text"
              placeholder={"Brief description or identifier"}
              required
            />
            <Spacer size="sm" />

            {/* Group Select */}
            <Select name="group" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Faculty" />
              </SelectTrigger>
              <SelectContent>
                {rawData &&
                  rawData.map((grp, key) => {
                    return (
                      <SelectItem value={grp._id} key={key}>
                        {grp.name}
                      </SelectItem>
                    );
                  })}
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
