import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
  return (
    <div className="w-full h-fit flex flex-col font-sans">
      {/* Table Heading */}
      <div className="h-10 grid grid-cols-12 bg-accent-light font-medium text-accent rounded-md">
        {tableHeading.map((rowCol, key) => (
          <div
            className={`h-full flex items-center pl-2 text-sm leading-none ${
              key < tableHeading.length - 1 ? "border-r" : ""
            } border-accent-mid ${rowCol.colSpan}`}
            key={key}
          >
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
          {row.map((rowCol, key) => (
            <div
              className={`h-full flex items-center pl-2 text-sm text-theme-gray ${
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
              key={key}
            >
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
