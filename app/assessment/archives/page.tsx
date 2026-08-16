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
import { getAxios } from "@/lib/axios";
import { prettyDate } from "@/lib/dateFormater";
import { toastConfig } from "@/utils/toastConfig";
import { Plus, Tag, X } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ArchiveRecord = {
  _id: string;
  assessment: string;
  assessmentTitle: string;
  archivedBy: { _id: string; fullName: string };
  responseCount: number;
  tags?: string[];
  createdAt: string;
};

type ArchiveFilter = {
  search: string;
  tag: string;
};

const EMPTY_ARCHIVE_FILTER: ArchiveFilter = {
  search: "",
  tag: "",
};

const Page = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<ArchiveRecord[] | null>(null);
  const [filteredPageData, setFilteredPageData] = useState<
    ArchiveRecord[] | null
  >(null);
  const [filters, setFilters] = useState<ArchiveFilter>(EMPTY_ARCHIVE_FILTER);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  // The record being tagged; doubles as the tag dialog's open state
  const [editingArchive, setEditingArchive] = useState<ArchiveRecord | null>(
    null,
  );
  const [tagDraft, setTagDraft] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const openTagDialog = (archive: ArchiveRecord) => {
    setEditingArchive(archive);
    setTagDraft(archive.tags ?? []);
    setTagInput("");
  };

  const addTag = (e: FormEvent) => {
    e.preventDefault();
    const value = tagInput.trim();
    if (!value) return;

    if (tagDraft.includes(value)) {
      toast.error("That tag is already on this archive.", toastConfig);
      return;
    }

    setTagDraft((prev) => [...prev, value]);
    setTagInput("");
  };

  // The endpoint replaces the whole array, so the draft is always sent in full
  const saveTags = async () => {
    if (!editingArchive) return;
    setLoading("saveTags");

    try {
      const api = await getAxios();
      const res = await api.patch(
        `/admin/archive/${editingArchive.assessment}/tags`,
        { tags: tagDraft },
      );

      if (res.status === 200 || res.status === 201) {
        const applyTags = (list: ArchiveRecord[] | null) =>
          list?.map((item) =>
            item._id === editingArchive._id
              ? { ...item, tags: tagDraft }
              : item,
          ) ?? null;

        setPageData(applyTags);
        setFilteredPageData(applyTags);
        setTagOptions((prev) => [...new Set([...prev, ...tagDraft])]);

        toast.success("Tags updated successfully", toastConfig);
        setEditingArchive(null);
      }

      setLoading(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to update tags, please retry.",
        toastConfig,
      );
      setLoading(null);
    }
  };

  const fetchArchives = async (next: ArchiveFilter) => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading("filterArchives");

    const query = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => value && query.set(key, value));

    try {
      const api = await getAxios();
      const res = await api.get(`/admin/archives?${query.toString()}`, {
        signal: controller.signal,
      });

      if (res.status === 200 || res.status === 201) {
        setFilteredPageData(res.data.data);
      }

      setLoading(null);
    } catch (error: any) {
      // A failed filter keeps the current rows on screen rather than
      // dropping the whole page into its error state
      if (error.name === "CanceledError") return;
      toast.error("Unable to filter archives, please retry.", toastConfig);
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const getArchives = async () => {
      try {
        const api = await getAxios();
        const res = await api.get("/admin/archives", {
          signal: controller.signal,
        });

        if (res.status === 200 || res.status === 201) {
          const archives: ArchiveRecord[] = res.data.data;
          setPageData(archives);
          setFilteredPageData(archives);

          // Built from the unfiltered load so narrowing a filter never removes
          // the option needed to widen it again
          setTagOptions([
            ...new Set(archives.flatMap((item) => item.tags ?? [])),
          ]);
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
  }, [session?.user?.id]);

  // Debounced server-side filtering
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!session?.user?.id) return;

    const timeout = setTimeout(() => {
      fetchArchives(filters);
    }, 350);

    return () => clearTimeout(timeout);
  }, [filters]);

  return (
    <div className="w-full h-full px-10 py-5 font-sans">
      {pageData && (
        <>
          <div className="flex items-center justify-between">
            <TableSearchBox
              placeholder="Search an archive"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />

            <div className="flex items-center gap-3">
              {loading === "filterArchives" ? (
                <Spinner className="size-4 text-theme-gray" />
              ) : (
                ""
              )}

              {filters.tag ? (
                <button
                  type="button"
                  className="text-sm text-theme-gray underline underline-offset-2 hover:text-accent cursor-pointer"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, tag: "" }))
                  }
                >
                  Clear tag
                </button>
              ) : (
                ""
              )}

              <Select
                value={filters.tag || "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    tag: val === "all" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="w-56 text-sm text-theme-gray bg-white rounded-xl">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {tagOptions.map((tag) => (
                    <SelectItem value={tag} key={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Spacer size="lg" />

          <Table
            className={
              filteredPageData?.length === 0 ? "rounded-b-none border-b-0" : ""
            }
            tableHeading={[
              { value: "Assessment", colSpan: "col-span-3" },
              { value: "Tags", colSpan: "col-span-2" },
              { value: "Archived By", colSpan: "col-span-2" },
              { value: "Responses", colSpan: "col-span-1" },
              { value: "Date Archived", colSpan: "col-span-3" },
              { value: "View", colSpan: "col-span-1" },
            ]}
            tableData={
              filteredPageData
                ? filteredPageData.map((item) => [
                    { value: item.assessmentTitle, colSpan: "col-span-3" },
                    {
                      colSpan: "col-span-2",
                      render: () => (
                        <button
                          type="button"
                          onClick={() => openTagDialog(item)}
                          className="flex items-center gap-1 overflow-hidden cursor-pointer hover:text-accent"
                          title="Manage tags"
                        >
                          {item.tags?.length ? (
                            <>
                              {item.tags.slice(0, 2).map((tag) => (
                                <span
                                  className="text-xs rounded-sm py-[1px] px-1.5 bg-accent-light text-accent whitespace-nowrap"
                                  key={tag}
                                >
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 2 ? (
                                <span className="text-xs">
                                  +{item.tags.length - 2}
                                </span>
                              ) : (
                                ""
                              )}
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-xs">
                              <Plus size={12} />
                              Add tags
                            </span>
                          )}
                        </button>
                      ),
                    },
                    {
                      value: item.archivedBy?.fullName ?? "—",
                      colSpan: "col-span-2",
                    },
                    { value: item.responseCount, colSpan: "col-span-1" },
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

          {filteredPageData?.length === 0 ? (
            <div className="border-x border-b rounded-b-xl bg-white h-20 flex items-center justify-center text-sm text-theme-gray">
              No archives match these filters.
            </div>
          ) : (
            ""
          )}

          {/* Dialog - Manage Tags */}
          <Dialog
            open={!!editingArchive}
            onOpenChange={(open) => !open && setEditingArchive(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Tags</DialogTitle>
                <DialogDescription>
                  Tags on "{editingArchive?.assessmentTitle}". Saving replaces
                  the archive's whole tag list.
                </DialogDescription>
              </DialogHeader>

              <Spacer size="sm" />

              <form onSubmit={addTag} className="flex items-center gap-2">
                <Input
                  name="tag"
                  type="text"
                  placeholder="e.g. 2023/2024"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  icon={<Tag size={16} />}
                />
                <div className="w-28 shrink-0">
                  <Button
                    type="submit"
                    title="Add"
                    loading={false}
                    variant="outline"
                    icon={<Plus size={16} />}
                  />
                </div>
              </form>

              <Spacer size="sm" />

              {tagDraft.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {tagDraft.map((tag) => (
                    <span
                      className="flex items-center gap-1 text-xs rounded-sm py-1 px-2 bg-accent-light text-accent"
                      key={tag}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setTagDraft((prev) =>
                            prev.filter((item) => item !== tag),
                          )
                        }
                        className="cursor-pointer hover:text-theme-error"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-theme-gray">
                  No tags yet. Saving now clears any existing tags.
                </div>
              )}

              <Spacer size="md" />

              <Button
                type="button"
                title="Save Tags"
                loading={loading === "saveTags"}
                variant="fill"
                icon={<Tag size={18} />}
                onClick={saveTags}
              />
            </DialogContent>
          </Dialog>
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
