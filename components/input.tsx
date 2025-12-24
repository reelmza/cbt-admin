import React, { JSX } from "react";
type InputType = {
  name: string;
  type: string;
  placeholder: string;
  icon?: JSX.Element;
};

const Input = ({ name, type, placeholder, icon }: InputType) => {
  return (
    <div className={`w-full h-12 flex border border-accent-light rounded-md`}>
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
        className="grow h-full text-sm outline-none px-3 text-accent-dim"
      />
    </div>
  );
};

export default Input;
