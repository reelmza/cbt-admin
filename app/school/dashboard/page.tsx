"use client";
import Spacer from "@/components/spacer";
import { CloudUpload, Notebook, Plus, UsersRound } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";

const Page = () => {
  const { data: session } = useSession();

  const quickLinks = [
    {
      name: "Bulk Upload Students",
      description: "Bulk upload students from a template file.",
      icon: <CloudUpload size={40} className="text-accent-dim" />,
    },

    {
      name: "Create an Assessment",
      description: "Create an instant assesment or schedule for a future date.",
      icon: <Notebook size={40} className="text-accent-dim" />,
    },

    {
      name: "Create a Group",
      description: "Create a group or a subgroup for a particular assessment.",
      icon: <UsersRound size={40} className="text-accent-dim" />,
    },
  ];

  return (
    <div className="grow min-h-full p-10 font-sans">
      {/* Top Banner */}
      <div className="px-10 py-14 bg-accent rounded-xl">
        <div className="text-3xl font-extrabold text-white">
          {session?.user.name}
        </div>
        <div className="text-accent-light text-lg">{session?.user.email}</div>
      </div>
      <Spacer size="xl" />

      {/* Quick Links */}
      <div className="text-2xl font-bold text-accent-dim">Quick Actions</div>
      <Spacer size="md" />
      <div className="flex flex-wrap justify-between">
        {quickLinks.map((link, key) => {
          return (
            <button
              className="w-[32%] min-h-52 p-10 pr-14 border border-theme-gray-mid shadow-xl shadow-theme-gray/5 rounded-xl cursor-pointer text-left hover:bg-accent-light/50 hover:border-accent-light animate-all duration-500 ease-in-out"
              key={key}
            >
              {link.icon}
              <Spacer size="md" />
              <div className="font-bold text-accent-dim text-xl">
                {link.name}
              </div>
              <div className="text-sm text-theme-gray">{link.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};
export default Dashboard;
