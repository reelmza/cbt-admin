import { Search } from "lucide-react";
import React from "react";

const TableSearchBox = ({ placeholder }: { placeholder: string }) => {
  return (
    <form className="flex items-center justify-betweenh-12 w-4/10 rounded-md border border-theme-gray-light">
      <input
        type="text"
        className="bg-transparent h-full grow px-3 text-sm outline-none text-theme-gray"
        placeholder={placeholder}
      />
      <button
        className="flex items-center justify-center h-10 w-12 bg-transparent border-l border-theme-gray-light hover:bg-theme-gray-light/50 cursor-pointer animate-all duration-200 ease-in"
        type="submit"
      >
        <Search size={16} className="text-theme-gray" />
      </button>
    </form>
  );
};

export default TableSearchBox;
