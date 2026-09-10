import {
  LayoutGrid,
  GitBranchPlus,
  BookCheck,
} from "lucide-react";

export const StatisticCardItem = [
    {
        title:"Branches",
        subtitle:"Statistics of Branches",
        icon:LayoutGrid,
        value:3,
        link: "/admin/dashboard/branch",
    },

    {
        title:"Administrators",
        subtitle:"Statistics of Administrators",
        icon:BookCheck,
        value:10,
        link: "/admin/dashboard",
    },

    {
        title:"Blog",
        subtitle:"Statistics of Blog",
        icon:GitBranchPlus,
        value:5,
        link: "/admin/dashboard",
    },

]