import {
  BellDot,
  Building,
  Building2,
  Check,
  CircleQuestionMark,
  Cog,
  Clock,
  GaugeCircle,
  GraduationCap,
  Library,
  Monitor,
  NotebookPen,
  NotepadText,
  Shield,
  UserRound,
  UsersRound,
  ScanEye,
} from "lucide-react";
import { JSX } from "react";

type SideBarStructure = {
  name: string;
  route: string;
  icon: JSX.Element;
  // Restrict visibility to these roles; omit to show for everyone.
  roles?: string[];
};

type SideBarPageType = {
  name: string;
  route: string;
  icon: JSX.Element;
  children?: SideBarStructure[];
  // Restrict visibility to these roles; omit to show for everyone.
  roles?: string[];
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
    children: [
      {
        name: "Archived",
        route: "/assessment/archives",
        icon: <Clock size={16} />,
        roles: ["superadmin"],
      },
    ],
  },
  // {
  //   name: "Results",
  //   route: "/results",
  //   icon: <NotepadText size={18} />,
  // },
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
    name: "Invigilator",
    route: "/invigilator",
    icon: <ScanEye size={18} />,
    roles: ["invigilator", "superadmin"],
  },
  {
    name: "Settings",
    route: "/settings",
    icon: <Cog size={18} />,
    roles: ["superadmin"],
  },
];
