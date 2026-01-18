import React, { JSX } from "react";
type InputType = {
  name: string;
  type: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: any) => void;
  placeholder: string;
  size?: "big" | "small";
  required?: boolean;
  icon?: JSX.Element;
  extraClasses?: string;
};

const Input = ({
  name,
  type,
  value,
  defaultValue,
  onChange,
  placeholder,
  size,
  required,
  icon,
  extraClasses,
}: InputType) => {
  return (
    <div
      className={`w-full ${
        !size || size == "small" ? "h-10" : "12"
      } ${extraClasses} flex border border-accent-light rounded-md`}
    >
      {/* Input Icon */}
      {icon ? (
        <div className="flex items-center justify-center h-full w-12 shrink-0 bg-accent-light text-accent-dim rounded-l-md border-accent-light border">
          {icon}
        </div>
      ) : (
        ""
      )}
      <input
        name={name}
        type={type}
        placeholder={placeholder || "Some input"}
        required={required || true}
        className="grow h-full text-sm outline-none px-3 text-accent-dim"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
