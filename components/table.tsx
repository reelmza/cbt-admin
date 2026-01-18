"use client";

import { ArrowRight, CloudUpload, Plus } from "lucide-react";
import Link from "next/link";
import CheckBox from "./table-checkbox";
import { useState } from "react";
import Button from "./button";
import Spacer from "./spacer";
import TableSearchBox from "./table-searchbox";

type TableType = {
  tableHeading: { value: string; colSpan: string }[];
  tableData: {
    value: string | number;
    colSpan: string;
    color?: "warning" | "info" | "success" | "error";
    type?: "badge" | "button" | "link";
  }[][];
  showSearch?: boolean | undefined;
  showOptions?: boolean | undefined;
};

const Table = ({
  tableHeading,
  tableData,
  showSearch,
  showOptions,
}: TableType) => {
  const [checkList, setCheckList] = useState<number[]>([]);
  return (
    <div className="w-full h-fit flex flex-col font-sans">
      {/* Options Row */}
      <div className="flex items-center justify-between">
        {/* Search Box */}
        {showSearch ? <TableSearchBox placeholder="Search" /> : ""}

        {/* Options Buttons */}
        {showOptions ? (
          <div className="w-fit flex items-center gap-2">
            <div className="w-48">
              <Button
                type="button"
                loading={false}
                title="Create Assesment"
                icon={<Plus size={16} strokeWidth={2.5} />}
                variant="fill"
              />
            </div>

            <div className="w-48">
              <Button
                type="button"
                loading={false}
                title="Upload Assessment"
                icon={<CloudUpload size={16} strokeWidth={2.5} />}
                variant="outline"
              />
            </div>
          </div>
        ) : (
          ""
        )}
      </div>

      <Spacer size="lg" />

      {/* Table Heading */}
      <div className="h-10 grid grid-cols-12 bg-accent-light font-medium text-accent rounded-md">
        {tableHeading.map((rowCol, key) => (
          <div
            className={`h-full flex items-center pl-2 text-sm leading-none gap-2 ${
              key < tableHeading.length - 1 ? "border-r" : ""
            } border-accent-mid ${rowCol.colSpan}`}
            key={key}
          >
            {/* Select  */}
            {key === 0 ? (
              <CheckBox
                type="all"
                state={{ checkList, setCheckList }}
                tableData={tableData}
              />
            ) : (
              ""
            )}

            {rowCol.value}
          </div>
        ))}
      </div>

      {/* Table Content */}
      {tableData.map((row, key) => (
        <div
          className={`h-12 grid grid-cols-12  border-b border-theme-gray-mid hover:bg-theme-gray-light/20 cursor-default`}
          key={key}
        >
          {row.map((rowCol, rowColKey) => (
            <div
              className={`h-full flex items-center pl-2 text-sm text-theme-gray gap-2 ${
                rowCol.colSpan
              } ${
                rowCol.color === "warning"
                  ? "text-theme-warning"
                  : rowCol.color === "info"
                  ? "text-theme-info "
                  : rowCol.color === "success"
                  ? "text-theme-succes"
                  : "text-theme-error"
              }`}
              key={rowColKey}
            >
              {/* Table Select toggler  */}
              {rowColKey === 0 ? (
                <CheckBox
                  type="single"
                  value={key + 1}
                  state={{ checkList, setCheckList }}
                />
              ) : (
                ""
              )}

              {/* Unset Row Column Type */}
              {rowCol.type === undefined ? rowCol.value : ""}

              {/* Badge Row Column Type */}
              {rowCol.type === "badge" ? (
                <span
                  className={`text-xs rounded-sm py-[1px] px-1.5 ${
                    rowCol.color === "warning"
                      ? "bg-theme-warning/5"
                      : rowCol.color === "info"
                      ? "bg-theme-info/5"
                      : rowCol.color === "success"
                      ? "bg-theme-success/5"
                      : "bg-theme-error/5"
                  }`}
                >
                  {rowCol.value}
                </span>
              ) : (
                ""
              )}

              {rowCol.type === "link" ? (
                <Link
                  href={`/${rowCol.value}`}
                  className="flex items-center justify-center gap-1 hover:text-theme-info"
                >
                  <span>View</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Table;
