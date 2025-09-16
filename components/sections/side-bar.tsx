"use client";
import { usePathname } from "next/navigation";

const SideBar = () => {
  const path = usePathname();

  // Hide sidebar on pre-auth pages
  if (path === "/" || path.includes("/reset-password")) {
    return;
  }
  return (
    <div className="flex flex-col w-2/10 h-full shrink-0 bg-accent-light p-10 font-sans">
      Hello Sidebar
    </div>
  );
};

export default SideBar;
