import { Check } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type CheckBoxType = {
  type: "all" | "single";
  state: {
    checkList: number[];
    setCheckList: Dispatch<SetStateAction<number[]>>;
  };
  value?: number;
  isChecked?: boolean;
  tableData?: {
    value: string | number;
    colSpan: string;
    color?: "warning" | "info" | "success" | "error";
    type?: "badge" | "button" | "link";
  }[][];
};
const CheckBox = ({ type, value, state, tableData }: CheckBoxType) => {
  const [check, setCheck] = useState(false);
  const { checkList, setCheckList } = state;

  useEffect(() => {
    if (type === "single") {
      const isStillChecked = checkList.find((item) => item === value);
      if (isStillChecked) {
        setCheck(true);
      } else {
        setCheck(false);
      }
    }
  }, [checkList]);

  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        className="peer hidden"
        value={""}
        {...(type === "single" ? { checked: check } : {})}
        onChange={(e) => {
          // If checkbox is a single checkbox
          // Else if checkbox is a select all checkbox
          if (type === "single") {
            setCheckList((prev) => {
              if (check) {
                const safeItems = prev.filter((item) => item !== value);
                return [...safeItems];
              } else {
                return [...prev, value] as number[];
              }
            });
          } else {
            if (e.target.checked) {
              const all: number[] = [];
              tableData?.forEach((item, key) => all.push(key + 1));
              setCheckList(all);
              console.log(all);
            } else {
              setCheckList([]);
            }
          }
        }}
      />
      <span className="w-[14px] h-[14px] rounded border border-theme-gray-dim flex items-center justify-center bg-transparent peer-checked:bg-accent peer-checked:border-accent text-transparent peer-checked:text-white">
        <Check size={12} strokeWidth={3} />
      </span>
    </label>
  );
};

export default CheckBox;
