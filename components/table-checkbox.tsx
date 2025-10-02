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
      // Check if the current checkbox is still checked after
      // a change to the checked list of items
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
      {/* Single check input */}
      {type === "single" ? (
        <input
          type="checkbox"
          className="peer hidden"
          value={value}
          checked={check}
          // {...(type === "single" ? { checked: check } : {})}
          onChange={(e) => {
            setCheckList((prev) => {
              if (check) {
                const safeItems = prev.filter((item) => item !== value);
                return [...safeItems];
              } else {
                return [...prev, value] as number[];
              }
            });
          }}
        />
      ) : (
        ""
      )}

      {/* Check all input */}
      {type === "all" ? (
        <input
          type="checkbox"
          className="peer hidden"
          value={""}
          onChange={(e) => {
            if (e.target.checked) {
              const all: number[] = [];
              tableData?.forEach((item, key) => all.push(key + 1));
              setCheckList(all);
              console.log(all);
            } else {
              setCheckList([]);
            }
          }}
        />
      ) : (
        ""
      )}

      {/* Check Icon */}
      <span className="w-[14px] h-[14px] rounded border border-theme-gray-dim flex items-center justify-center bg-transparent peer-checked:bg-accent peer-checked:border-accent text-transparent peer-checked:text-white">
        <Check size={12} strokeWidth={3} />
      </span>
    </label>
  );
};

export default CheckBox;
