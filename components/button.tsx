import { JSX } from "react";

type ButtonType = {
  title: string;
  icon?: JSX.Element;
};

const Button = ({ title, icon }: ButtonType) => {
  return (
    <button
      className={`flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-accent hover:bg-accent/80 text-accent-light`}
    >
      <span>{title}</span>
      {icon ? icon : ""}
    </button>
  );
};

export default Button;
