import {
  BellDot,
  Building,
  Building2,
  Check,
  CircleQuestionMark,
  Cog,
  GaugeCircle,
  GraduationCap,
  Library,
  Monitor,
  NotebookPen,
  NotepadText,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";
import { JSX } from "react";

type SideBarStructure = {
  name: string;
  route: string;
  icon: JSX.Element;
};

type SideBarPageType = {
  name: string;
  route: string;
  icon: JSX.Element;
  children?: SideBarStructure[];
};
export const sideBarPages: SideBarPageType[] = [
  {
    name: "Dashboard",
    route: "/dashboard",
    icon: <GaugeCircle size={18} />,
  },
  {
    name: "Users",
    route: "/users",
    icon: <UserRound size={18} />,
    // children: [
    //   { name: "Staff", route: "/users", icon: <UsersRound size={16} /> },
    //   {
    //     name: "Students",
    //     route: "/students",
    //     icon: <GraduationCap size={16} />,
    //   },
    // ],
  },

  {
    name: "Faculties",
    route: "/faculties",
    icon: <Building2 size={18} />,
    children: [
      {
        name: "Departments",
        route: "/faculties/departments",
        icon: <Building size={16} />,
      },
    ],
  },
  {
    name: "Courses",
    route: "/courses",
    icon: <NotebookPen size={18} />,
  },

  {
    name: "Assessments",
    route: "/assessment",
    icon: <Library size={18} />,
    // children: [
    //   {
    //     name: "Ongoing",
    //     route: "/exams",
    //     icon: <Monitor size={16} />,
    //   },
    //   {
    //     name: "Completed Exams",
    //     route: "/exams/complete",
    //     icon: <Check size={16} />,
    //   },
    // ],
  },
  {
    name: "Results",
    route: "/results",
    icon: <NotepadText size={18} />,
  },
  // {
  //   name: "Notifications",
  //   route: "/notifications",
  //   icon: <BellDot size={18} />,
  // },
  // {
  //   name: "Security",
  //   route: "/security",
  //   icon: <Shield size={18} />,
  // },
  {
    name: "Settings",
    route: "/settings",
    icon: <Cog size={18} />,
  },
];
