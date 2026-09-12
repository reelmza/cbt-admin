"use client";
import { sideBarPages } from "@/utils/sidebar-pages";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Spacer from "../spacer";
import { LogOut, Menu, PanelLeftClose } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { getSchool } from "@/utils/schools";
import { canAccessRoute } from "@/lib/access";
import { cloneElement, useState } from "react";

const SideBar = ({
  schoolName,
  role,
}: {
  schoolName?: string | null;
  role?: string | null;
}) => {
  const path = usePathname();
  const [expanded, setExpanded] = useState(false);

  // Hide sidebar on pre-auth pages
  if (
    path === "/" ||
    path.includes("/reset-password") ||
    path.includes("signup") ||
    path.includes("login")
  ) {
    return null;
  }

  const school = getSchool(schoolName);

  // Visibility comes from the same policy the middleware enforces, so a link is
  // only ever shown when the role can actually open it
  const visiblePages = sideBarPages.filter((item) =>
    canAccessRoute(role ?? undefined, item.route),
  );

  /* The bar itself is fixed, so the ghost below it is what actually holds the
   * main content's width open — the two must always agree */
  const width = expanded ? "w-2/10" : "w-20";

  return (
    <>
      <div
        className={`fixed left-0 z-40 flex flex-col ${width} h-full shrink-0 border-r border-theme-gray-light bg-white py-5 ${
          expanded ? "px-5" : "px-3"
        } font-sans transition-all duration-200 ease-in-out`}
      >
        {/* Logo */}
        <div className="h-fit">
          <div
            className={`flex items-center gap-2 ${
              expanded ? "" : "justify-center"
            }`}
          >
            <Image
              src={school.image}
              alt="School logo"
              width={expanded ? 48 : 34}
              unoptimized
              className="shrink-0"
              loading="eager"
            />

            {/* Collapsed leaves the logo to stand on its own */}
            {expanded && (
              <div className="grow border-l pl-2">
                <div className="leading-none font-bold font-serif text-accent-dim">
                  {school.shortName}
                </div>
                <div className="text-xs text-theme-gray leading-tight">
                  {school.fullName}
                </div>
              </div>
            )}
          </div>
          <Spacer size="sm" />

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? "Collapse menu" : "Expand menu"}
            aria-label={expanded ? "Collapse menu" : "Expand menu"}
            aria-expanded={expanded}
            className={`flex items-center w-full rounded-xl text-theme-gray hover:text-accent hover:bg-theme-gray-slight/50 cursor-pointer animate-all duration-200 ease-in ${
              expanded ? "h-9 gap-2 px-2 text-sm" : "h-11 justify-center"
            }`}
          >
            {expanded ? <PanelLeftClose size={18} /> : <Menu size={24} />}
            {expanded && <span>Collapse</span>}
          </button>
          <Spacer size="sm" />
        </div>

        {/* Sidebar Links */}
        <ul className="grow flex flex-col gap-y-2 w-full">
          {visiblePages.map((item, key) => (
            <li key={key} className="w-full h-fit">
              {/* Main Link */}
              <Link
                href={item.route}
                title={expanded ? undefined : item.name}
                className={`flex items-center w-full text-sm ${
                  expanded ? "h-9 gap-2 px-2" : "h-11 justify-center"
                } ${
                  path.includes(item.route)
                    ? "bg-accent-light/50 border border-accent-light text-accent-dim hover:bg-accent-light/70"
                    : "text-theme-gray hover:text-accent hover:bg-theme-gray-slight/50"
                }  rounded-xl animate-all duration-200 ease-in`}
              >
                {/* Nothing but the icon is left to read when collapsed, so it
                 * carries the whole target and is sized up to match */}
                {expanded ? item.icon : cloneElement(item.icon, { size: 24 })}
                {expanded && <span>{item.name}</span>}
              </Link>

              {/* Link Children */}
              {expanded && path.includes(item.route) && item.children ? (
                <div className="pl-8 mt-4 flex flex-col">
                  {item.children
                    .filter((itemChild) =>
                      canAccessRoute(role ?? undefined, itemChild.route),
                    )
                    .map((itemChild, key) => (
                      <Link
                        href={itemChild.route}
                        key={key}
                        className={`relative flex items-center text-sm ${
                          path.includes(itemChild.route)
                            ? "text-accent font-semibold"
                            : "text-theme-gray"
                        } hover:text-accent gap-2 mb-4`}
                      >
                        {itemChild?.icon}
                        <span>{itemChild.name}</span>
                        <div className="absolute -left-4 h-[1px] w-2"></div>
                      </Link>
                    ))}
                </div>
              ) : (
                ""
              )}
            </li>
          ))}
        </ul>

        <button
          title={expanded ? undefined : "Logout"}
          className={`shrink-0 flex items-center w-full rounded-md hover:bg-theme-gray-light cursor-pointer text-sm ${
            expanded ? "h-10 gap-2 px-2" : "h-11 justify-center"
          }`}
          onClick={() => signOut({ redirectTo: `${window.location.origin}/` })}
        >
          <LogOut size={expanded ? 16 : 24} />
          {expanded && <span>Logout</span>}
        </button>
      </div>

      <div
        className={`${width} h-full shrink-0 transition-all duration-200 ease-in-out`}
      ></div>
    </>
  );
};

export default SideBar;
