import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Info } from "lucide-react";
import SideBar from "@/components/sections/side-bar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CBT V2",
  description:
    "An offline CBT web application for conducting and managing exams in Nigerian tertiary institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
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
          <SideBar />
          {children}
        </div>

        <Toaster />
      </body>
    </html>
  );
}
