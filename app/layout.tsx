import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";

import "./globals.css";
import { Info } from "lucide-react";
import SideBar from "@/components/sections/side-bar";
import { Toaster } from "@/components/ui/sonner";
import SessionExpiredOverlay from "@/components/session-expired-overlay";
import { getSchool } from "@/utils/schools";
import { fetchSchoolName } from "@/lib/getSchoolName";
import { auth } from "@/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const school = getSchool(await fetchSchoolName());
  return {
    title: school.name,
    description:
      "An offline CBT web application for conducting and managing exams in Nigerian tertiary institutions.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schoolName = await fetchSchoolName();
  const session = await auth();

  return (
    <html lang="en" data-school={(schoolName || "default").toLowerCase()}>
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased`}
      >
        {/* Info text for smaller screens */}
        <div className="md:hidden h-full w-full bg-neutral-50 flex flex-col items-center justify-center">
          <Info size={32} className="text-accent-dim" />
          <div className="px-5 py-5 text-center text-accent-dim font-sans font">
            This app is a desktop app, <br /> please use a desktop device or a
            tablet.
          </div>
        </div>

        {/* Show app only on desktop */}
        <div className="hidden md:flex items-center justify-center h-full w-full">
          <SideBar schoolName={schoolName} role={session?.user?.role} />
          {children}
        </div>

        <SessionExpiredOverlay />
        <Toaster />
      </body>
    </html>
  );
}
