import { Search } from "lucide-react";
import React from "react";

const TableSearchBox = () => {
  return (
    <form className="flex items-center justify-betweenh-12 w-4/10 rounded-md border border-theme-gray-light">
      <input
        type="text"
        className="bg-transparent h-full grow px-3 text-sm outline-none text-theme-gray"
        placeholder="Search for an assessment"
      />
      <button
        className="flex items-center justify-center h-10 w-12 bg-theme-gray-light hover:bg-theme-gray-light/50 cursor-pointer animate-all duration-20 ease-in"
        type="submit"
      >
        <Search size={16} className="text-theme-gray" />
      </button>
    </form>
  );
};

export default TableSearchBox;
