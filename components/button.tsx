import { ArrowRight, ChevronRight } from "lucide-react";
import React from "react";
type ButtonType = {
  title: string;
};
const Button = ({ title }: ButtonType) => {
  return (
    <button className="flex items-center justify-center h-12 w-full bg-accent hover:bg-accent-dim text-white font-semibold rounded-md leading-0 gap-2 shadow-sm cursor-pointer animate-all duration-200 ease-in-out">
      <span>{title}</span>
      <ArrowRight size={20} />
    </button>
  );
};

export default Button;
