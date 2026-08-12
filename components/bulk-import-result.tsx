import { BulkImportResult } from "@/lib/bulkImport";

const BulkImportSummary = ({ result }: { result: BulkImportResult }) => (
  <div className="text-sm">
    <div className="flex items-center gap-4">
      <span className="text-theme-success">
        {result.created.length} created
      </span>
      <span className="text-theme-gray">{result.skipped.length} skipped</span>
      <span className={result.errors.length ? "text-theme-error" : "text-theme-gray"}>
        {result.errors.length} failed
      </span>
    </div>

    {result.skipped.length || result.errors.length ? (
      <div className="mt-3 max-h-40 overflow-auto rounded-md border border-theme-gray-mid p-3 text-xs">
        {result.errors.map((item, key) => (
          <div className="text-theme-error" key={`error-${key}`}>
            {item}
          </div>
        ))}
        {result.skipped.map((item, key) => (
          <div className="text-theme-gray" key={`skipped-${key}`}>
            Skipped — {item}
          </div>
        ))}
      </div>
    ) : (
      ""
    )}
  </div>
);

export default BulkImportSummary;
