import { JSX } from "react";
import { Spinner } from "./ui/spinner";

type ButtonType = {
  title: string;
  loading: boolean;
  icon?: JSX.Element;
  variant: "fill" | "outline";
};

const Button = ({ title, loading, icon, variant }: ButtonType) => {
  const buttonVariants = {
    fill: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-accent hover:bg-accent/80 text-accent-light shadow shadow-accent-light/20 ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,

    outline: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-transparent hover:bg-theme-gray-light/80 text-theme-gray border border-theme-gray-light shadow-sm shadow-theme-gray-light/20 ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,
  };
  return (
    <button className={buttonVariants[variant]} disabled={loading}>
      <span>{title}</span>
      {loading ? <Spinner /> : icon}
    </button>
  );
};

export default Button;
