"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PageNavigator = ({
  navList,
}: {
  navList: {
    name: string;
    route?: string;
    fx?: () => void;
  }[];
}) => {
  const path = usePathname();
  const [activeButton, setActiveButton] = useState<null | string>(
    "All Assessment",
  );

  return (
    <div className="relative h-10 w-fit">
      <div className="absolute bottom-[5px] w-full h-[1px] bg-theme-gray-light"></div>
      {/* Item List */}
      <div className="absolute h-full top-0 left-0 w-fit flex items-center z-20">
        {navList.map((item, key) => (
          <div key={key}>
            {item.route ? (
              <Link
                href={item.route}
                className={`flex items-center justify-center h-full text-sm py-1 ${key < navList.length - 1 ? "mr-4" : ""} ${
                  path === item.route
                    ? "border-b-1 text-accent font-semibold"
                    : "border-none text-theme-gray hover:text-accent"
                } border-accent cursor-pointer`}
                key={key}
              >
                {item.name}
              </Link>
            ) : (
              <button
                className={`flex items-center justify-center h-full text-sm  ${key < navList.length - 1 ? "mr-4" : ""} ${
                  activeButton === item.name
                    ? "border-b-3 text-accent"
                    : "border-none text-theme-gray hover:text-accent"
                } border-accent cursor-pointer`}
                key={key}
                onClick={() => {
                  setActiveButton(item.name);
                  item.fx && item.fx();
                }}
              >
                {item?.name}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Ghost Element Ignore */}
      <div className="opacity-0 h-full top-0 left-0 w-fit flex items-center">
        {navList.map((item, key) => (
          <div key={key}>
            {item.route ? (
              <Link
                href={item.route}
                className={`flex items-center justify-center h-full text-sm py-1 ${key < navList.length - 1 ? "mr-4" : ""} ${
                  path === item.route
                    ? "border-b-1 text-accent font-semibold"
                    : "border-none text-theme-gray hover:text-accent"
                } border-accent cursor-pointer`}
                key={key}
              >
                {item.name}
              </Link>
            ) : (
              <button
                className={`flex items-center justify-center h-full text-sm  ${key < navList.length - 1 ? "mr-4" : ""} ${
                  activeButton === item.name
                    ? "border-b-3 text-accent"
                    : "border-none text-theme-gray hover:text-accent"
                } border-accent cursor-pointer`}
                key={key}
                onClick={() => {
                  setActiveButton(item.name);
                  item.fx && item.fx();
                }}
              >
                {item?.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageNavigator;
