'use client';

import React from 'react';
import styles from "@/styles/component/sidebar.module.css";
import { usePathname } from 'next/navigation';
import { sidebarItems } from "@/data/sidebar-item";
import { useProfile } from "@/components/api/client";
import Link from "next/link";

const Sidebar = () => {
    const pathname = usePathname();
    const { data: user } = useProfile();

    const role = user?.role || '';

    // Filter sidebar modules based on role
    const filteredItems = sidebarItems.filter((item) => {
        if (role === 'Head of Department') {
            // HOD does not see Department module
            return item.link !== '/admin/dashboard/department';
        }
        if (role === 'Lecturer') {
            // Lecturer does not see Department, Course, or Staff modules
            return (
                item.link !== '/admin/dashboard/department' &&
                item.link !== '/admin/dashboard/course' &&
                item.link !== '/admin/dashboard/staff'
            );
        }
        return true;
    });

    return (
        <aside className="fixed bottom-0 w-32.5 bg-white z-10 h-[calc(100%-70px)] ">
            <ul className="w-full h-full flex flex-col gap-5 items-center justify-start p-5 overflow-y-auto">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.link;
                    return (
                        <li key={item.link} className="w-full">
                            <Link
                                href={item.link}
                                className={`${styles.list} ${isActive ? styles.active : ""}`}>
                                <item.icon size={19} />
                                <span className={`${styles.span}`}>{item.name}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

export default Sidebar;