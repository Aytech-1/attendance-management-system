import {
  LayoutGrid,
  Building2,
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

export const sidebarItems = [
  {
    name: "Dashboard",
    link: "/admin/dashboard",
    icon: LayoutGrid
  },
  {
    name: "Department",
    link: "/admin/dashboard/department",
    icon: Building2
  },
  {
    name: "Course",
    link: "/admin/dashboard/course",
    icon: BookOpen
  },
  {
    name: "Staff",
    link: "/admin/dashboard/staff",
    icon: UserCheck
  },
  {
    name: "Students",
    link: "/admin/dashboard/students",
    icon: Users
  },
  {
    name: "Session",
    link: "/admin/dashboard/session",
    icon: GraduationCap
  },
  {
    name: "Attendance",
    link: "/admin/dashboard/attendance",
    icon: ClipboardList
  },
];
