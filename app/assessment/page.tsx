import Table from "@/components/table";
import { assessmentTableData } from "@/utils/dummy-data";

const Exams = () => {
  return (
    <div className="w-full h-full p-10 font-sans">
      <Table
        tableHeading={[
          { value: "Course", colSpan: "col-span-3" },
          { value: "Due Date", colSpan: "col-span-3" },
          { value: "Sections", colSpan: "col-span-1" },
          { value: "Questions", colSpan: "col-span-1" },
          { value: "Students", colSpan: "col-span-1" },
          { value: "Pass (%)", colSpan: "col-span-1" },
          { value: "Status", colSpan: "col-span-1" },
          { value: "Actions", colSpan: "col-span-1" },
        ]}
        tableData={assessmentTableData.map((item, key) => [
          { value: item.name, colSpan: "col-span-3" },
          { value: item.due, colSpan: "col-span-3" },
          { value: item.sections, colSpan: "col-span-1" },
          { value: item.questions, colSpan: "col-span-1" },
          { value: item.students, colSpan: "col-span-1" },
          { value: item.pass, colSpan: "col-span-1" },
          {
            value: item.status,
            colSpan: "col-span-1",
            type: "badge",
            color: `${
              item.status === "Pending"
                ? "warning"
                : item.status === "Ongoing"
                ? "info"
                : "success"
            }`,
          },
          { value: key, colSpan: "col-span-1", type: "link" },
        ])}
        showSearch={false}
        showOptions={false}
      />
    </div>
  );
};

export default Exams;
