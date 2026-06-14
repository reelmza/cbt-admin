"use client";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import Table from "@/components/table";
import TableSearchBox from "@/components/table-searchbox";
import { attachHeaders, getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { SessionProvider, useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";

type ArchiveRecord = {
  _id: string;
  assessment: string;
  assessmentTitle: string;
  archivedBy: { _id: string; fullName: string };
  responseCount: number;
  createdAt: string;
};

const Page = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<ArchiveRecord[] | null>(null);
  const [filteredPageData, setFilteredPageData] = useState<
    ArchiveRecord[] | null
  >(null);

  const searchArchive = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();

    if (val === "") {
      setFilteredPageData(pageData);
      return;
    }

    setFilteredPageData(
      pageData?.filter((dt) =>
        dt.assessmentTitle.toUpperCase().includes(val),
      ) ?? null,
    );
  };

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getArchives = async () => {
      try {
        const api = await getAxios();
        attachHeaders(session!.user.token);
        const res = await api.get("/admin/archives", {
          signal: controller.signal,
        });

        if (res.status === 200 || res.status === 201) {
          setPageData(res.data.data);
          setFilteredPageData(res.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
        }
      }
    };

    !pageData && getArchives();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {pageData && (
        <>
          <div className="flex items-center justify-between">
            <TableSearchBox
              placeholder="Search an archive"
              onChange={searchArchive}
            />
          </div>

          <Spacer size="lg" />

          <Table
            tableHeading={[
              { value: "Assessment", colSpan: "col-span-3" },
              { value: "Archived By", colSpan: "col-span-3" },
              { value: "Responses", colSpan: "col-span-2" },
              { value: "Date Archived", colSpan: "col-span-3" },
              { value: "View", colSpan: "col-span-1" },
            ]}
            tableData={
              filteredPageData
                ? filteredPageData.map((item) => [
                    { value: item.assessmentTitle, colSpan: "col-span-3" },
                    {
                      value: item.archivedBy?.fullName ?? "—",
                      colSpan: "col-span-3",
                    },
                    { value: item.responseCount, colSpan: "col-span-2" },
                    {
                      value: prettyDate(item.createdAt.split("T")[0]),
                      colSpan: "col-span-3",
                    },
                    {
                      value: `assessment/archives/${item.assessment}`,
                      colSpan: "col-span-1",
                      type: "link" as const,
                    },
                  ])
                : []
            }
            showSearch={false}
            showOptions={false}
          />
        </>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
      <Spacer size="xl" />
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
