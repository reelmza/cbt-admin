import { JSX } from "react";

type ButtonType = {
  title: string;
  icon?: JSX.Element;
  variant: "fill" | "outline";
};

const buttonVariants = {
  fill: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-accent hover:bg-accent/80 text-accent-light shadow shadow-accent-light/20`,

  outline: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-transparent hover:bg-theme-gray-light/80 text-theme-gray border border-theme-gray-light shadow-sm shadow-theme-gray-light/20`,
};

const Button = ({ title, icon, variant }: ButtonType) => {
  return (
    <button className={buttonVariants[variant]}>
      <span>{title}</span>
      {icon ? icon : ""}
    </button>
  );
};

export default Button;
