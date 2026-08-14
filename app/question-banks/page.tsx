"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Preload from "@/components/preload";
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
import {
  createQuestionBank,
  listQuestionBanks,
  QuestionBank,
} from "@/lib/questionBanks";
import { toastConfig } from "@/utils/toastConfig";
import { Plus } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type BankFilter = {
  search: string;
  subject: string;
};

const EMPTY_BANK_FILTER: BankFilter = { search: "", subject: "" };

const Page = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [banks, setBanks] = useState<QuestionBank[] | null>(null);
  const [pageMetaData, setPageMetaData] = useState<{
    page: number;
    pages: number;
    total: number;
  } | null>(null);
  const [openCreateBank, setOpenCreateBank] = useState(false);
  const [filters, setFilters] = useState<BankFilter>(EMPTY_BANK_FILTER);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const fetchBanks = async (
    next: BankFilter,
    page: number,
    loadingKey: string,
  ) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(loadingKey);

    const result = await listQuestionBanks({
      search: next.search,
      subject: next.subject,
      page,
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    if (!result) {
      // A failed search keeps the rows already on screen; only a failed first
      // load has nothing to fall back to
      setLoading(banks ? null : "pageError");
      return;
    }

    setBanks(result.banks);
    setPageMetaData({
      page: result.page,
      pages: result.pages,
      total: result.total,
    });

    // Built from the unfiltered load so narrowing the subject never removes the
    // option needed to widen it again
    if (loadingKey === "page") {
      setSubjectOptions([
        ...new Set(result.banks.map((bank) => bank.subject).filter(Boolean)),
      ] as string[]);
    }

    setLoading(null);
  };

  const getPage = (direction: "next" | "prev") => {
    if (!pageMetaData) return;
    const targetPage =
      direction === "next" ? pageMetaData.page + 1 : pageMetaData.page - 1;

    if (targetPage < 1 || targetPage > pageMetaData.pages) return;
    fetchBanks(filters, targetPage, `${direction}Page`);
  };

  // A new bank opens straight into its builder, which is where questions are added
  const addBank = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      bankTitle: { value: string };
      bankSubject: { value: string };
      bankDescription: { value: string };
    };

    setLoading("addBank");
    const bank = await createQuestionBank({
      title: target.bankTitle.value,
      subject: target.bankSubject.value,
      description: target.bankDescription.value,
    });
    setLoading(null);

    if (!bank?._id) return;

    toast.success("Question bank created.", toastConfig);
    router.push(`/question-banks/${bank._id}`);
  };

  // Debounced server-side filtering
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session?.user?.id) return;

    const timeout = setTimeout(() => {
      fetchBanks(filters, 1, "search");
    }, 350);

    return () => clearTimeout(timeout);
  }, [filters]);

  // Initial load
  useEffect(() => {
    if (!session?.user?.id) return;
    !banks && fetchBanks(EMPTY_BANK_FILTER, 1, "page");

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [session?.user?.id]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {banks && (
        <>
          {/* Table Options */}
          <div className="flex items-center justify-between">
            <TableSearchBox
              placeholder="Search question banks by title"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />

            <div className="flex items-center gap-3">
              <div className="w-56">
                <Button
                  title="Create Question Bank"
                  icon={<Plus size={16} strokeWidth={2.5} />}
                  variant="fill"
                  loading={false}
                  type="button"
                  onClick={() => setOpenCreateBank(true)}
                />
              </div>
            </div>
          </div>
          <Spacer size="sm" />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select
              value={filters.subject || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  subject: value === "all" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map((subject) => (
                  <SelectItem value={subject} key={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loading === "search" ? (
              <Spinner className="size-4 text-theme-gray" />
            ) : (
              ""
            )}

            {filters.subject ? (
              <button
                type="button"
                className="text-xs text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, subject: "" }))
                }
              >
                Clear filter
              </button>
            ) : (
              ""
            )}
          </div>
          <Spacer size="md" />

          {/* Navigation */}
          <div className="flex items-center justify-between w-4/10">
            <button
              className="flex items-center justify-center gap-2 h-8 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm"
              onClick={() => getPage("prev")}
            >
              <span>Previous</span>
              {loading === "prevPage" ? <Spinner className="size-4" /> : ""}
            </button>
            <div className="text-sm">
              Page {pageMetaData?.page} of {pageMetaData?.pages}{" "}
              {`(${pageMetaData?.total})`}
            </div>
            <button
              className="flex items-center justify-center gap-2 h-8 w-28 rounded-xs border text-theme-gray cursor-pointer text-sm"
              onClick={() => getPage("next")}
            >
              <span>Next</span>
              {loading === "nextPage" ? <Spinner className="size-4" /> : ""}
            </button>
          </div>

          <Table
            tableHeading={[
              { value: "Title", colSpan: "col-span-3" },
              { value: "Subject", colSpan: "col-span-2" },
              { value: "Description", colSpan: "col-span-4" },
              // The list route returns no question count, so it is only shown
              // inside the bank itself
              { value: "Created", colSpan: "col-span-2" },
              { value: "", colSpan: "col-span-1" },
            ]}
            tableData={banks.map((bank) => [
              { value: bank.title, colSpan: "col-span-3" },
              { value: bank.subject || "—", colSpan: "col-span-2" },
              { value: bank.description || "—", colSpan: "col-span-4" },
              {
                value: bank.createdAt?.split("T")[0] ?? "—",
                colSpan: "col-span-2",
              },
              {
                value: `question-banks/${bank._id}`,
                colSpan: "col-span-1",
                type: "link" as const,
              },
            ])}
            showSearch={false}
            showOptions={false}
          />

          {banks.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-sm text-theme-gray">
              No question banks yet. Create one to start pooling questions.
            </div>
          ) : (
            ""
          )}

          {/* Create a question bank */}
          <Dialog open={openCreateBank} onOpenChange={setOpenCreateBank}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Question Bank</DialogTitle>
                <DialogDescription className="pr-28">
                  Name the bank, then add questions to it on the next screen.
                </DialogDescription>
              </DialogHeader>

              <form className="pr-28" onSubmit={addBank}>
                <Input
                  name="bankTitle"
                  type="text"
                  placeholder="Bank title"
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="bankSubject"
                  type="text"
                  placeholder="Subject, used for filtering"
                  required
                />
                <Spacer size="sm" />

                <Input
                  name="bankDescription"
                  type="text"
                  placeholder="Brief description"
                  required
                />
                <Spacer size="md" />

                <Button
                  title="Create and add questions"
                  loading={loading === "addBank"}
                  variant="fill"
                  icon={<Plus size={20} />}
                />
                <Spacer size="md" />
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Preload loading={loading} pageData={banks ? true : false} />
    </div>
  );
};

const QuestionBanks = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default QuestionBanks;
