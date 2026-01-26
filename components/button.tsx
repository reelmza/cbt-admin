import { JSX } from "react";
import { Spinner } from "./ui/spinner";

type ButtonType = {
  title: string;
  loading: boolean;
  variant: "fill" | "outline" | "fillError" | "fillErrorOutline";
  icon?: JSX.Element;
  type?: "submit" | "button";
  onClick?: () => void;
};

const Button = ({
  title,
  type,
  loading,
  icon,
  variant,
  onClick,
}: ButtonType) => {
  const buttonVariants = {
    fill: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-accent hover:bg-accent/80 text-accent-light shadow shadow-accent-light/20 ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,

    fillError: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-theme-error hover:bg-theme-error/80 text-white shadow shadow-theme-error-light/20 ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,

    fillErrorOutline: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm border-theme-error/50 border text-theme-error ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,

    outline: `flex items-center justify-center h-10 w-full font-medium rounded-md leading-0 gap-2 cursor-pointer animate-all duration-200 ease-in text-sm bg-transparent hover:bg-theme-gray-light/80 text-theme-gray border border-theme-gray-light shadow-sm shadow-theme-gray-light/20 ${
      loading ? "opacity-75 pointer-events-none" : ""
    }`,
  };
  return (
    <button
      type={type || "submit"}
      className={buttonVariants[variant]}
      disabled={loading}
      onClick={onClick}
    >
      <span>{title}</span>
      {loading ? <Spinner /> : icon}
    </button>
  );
};

export default Button;
