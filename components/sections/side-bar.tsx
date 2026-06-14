"use client";
import { sideBarPages } from "@/utils/sidebar-pages";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Spacer from "../spacer";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { getSchool } from "@/utils/schools";

const SideBar = ({ schoolName }: { schoolName?: string | null }) => {
  const path = usePathname();

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

  return (
    <>
      <div className="fixed left-0 flex flex-col w-2/10 h-full shrink-0 border-r border-theme-gray-light bg-background py-5 px-5 font-sans">
        {/* Logo */}
        <div className="h-fit">
          <div className="flex items-center gap-2">
            <Image
              src={school.image}
              alt="School logo"
              width={48}
              unoptimized
              className="shrink-0"
              loading="eager"
            />

            <div className="grow border-l pl-2">
              <div className="leading-none font-bold font-serif text-accent-dim">
                {school.shortName}
              </div>
              <div className="text-xs text-theme-gray leading-tight">
                {school.fullName}
              </div>
            </div>
          </div>
          <Spacer size="md" />
        </div>

        {/* Sidebar Links */}
        <ul className="grow flex flex-col gap-y-2 w-full">
          {sideBarPages.map((item, key) => (
            <li key={key} className="w-full h-fit">
              {/* Main Link */}
              <Link
                href={item.route}
                className={`h-10 flex items-center w-full gap-2 text-sm px-2 ${
                  path.includes(item.route)
                    ? "bg-accent-light/50 text-accent-dim hover:bg-accent-light/70"
                    : "text-theme-gray hover:text-accent hover:bg-theme-gray-slight/50"
                } rounded-xs animate-all duration-200 ease-in`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>

              {/* Link Children */}
              {path.includes(item.route) && item.children ? (
                <div className="pl-8 mt-4 flex flex-col">
                  {item.children.map((itemChild, key) => (
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
          className="shrink-0 flex items-center gap-2 px-2 rounded-md h-10 w-full hover:bg-theme-gray-light cursor-pointer text-sm"
          onClick={() => signOut({ redirectTo: `${window.location.origin}/` })}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
      <div className="w-2/10 h-full shrink-0"></div>
    </>
  );
};

export default SideBar;
