'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import tableStyles from "@/styles/component/table.module.css";
import dashboardStyles from "@/styles/component/dashboard.module.css";
import { useStaffList } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import Image from "next/image";
import { SquarePlus, UserStar, Users } from "lucide-react";

import { formatDisplayName } from "@/utils/format-name";

const StaffPage = () => {
    const router = useRouter();
    const { user: profile } = useAuth();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (profile && profile.role === 'Lecturer') {
            router.replace('/admin/dashboard');
        }
    }, [profile, router]);

    // Fetch staff list from backend API
    const { data: staffData, isLoading } = useStaffList({
        search,
        page,
    });

    const getStaffRole = (staff: Record<string, any>) => {
        return staff.role || staff.roles?.[0]?.name || 'Lecturer';
    };

    const getStaffTitle = (staff: Record<string, any>) => {
        return (
            staff.designation ||
            staff.staff_profile?.designation ||
            staff.staffProfile?.designation ||
            staff.staff_id ||
            staff.staff_profile?.staff_id ||
            staff.staffProfile?.staff_id ||
            'N/A'
        );
    };

    const getStaffGender = (staff: Record<string, any>) => {
        return (
            staff.gender ||
            staff.staff_profile?.gender ||
            staff.staffProfile?.gender ||
            'N/A'
        );
    };

    const getStaffPhone = (staff: any) => {
        return (
            staff.phone ||
            staff.staff_profile?.phone ||
            staff.staffProfile?.phone ||
            'N/A'
        );
    };

    const isHod = profile?.role === 'Head of Department';

    return (
        <div className="w-full flex flex-col ">
            <div className={dashboardStyles.dashboardHeader}>
                <div className={dashboardStyles.headerLeft}>
                    <div className={dashboardStyles.headerIcon}>
                        <UserStar />
                    </div>
                    <div className={dashboardStyles.headerText}>
                        <h2>Administrators & Staff</h2>
                        <p>
                            {isHod 
                                ? "View staff accounts assigned to your department."
                                : "Manage administrator and lecturer accounts with ease. Assign roles, control access, and oversee activities."
                            }
                        </p>
                    </div>
                </div>

                <div className={dashboardStyles.staffHeader}>
                    <div className={dashboardStyles.searchInput}>
                        <input 
                            className={dashboardStyles.input}
                            type="text"
                            placeholder="Search Staff here..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {!isHod && (
                        <div className={dashboardStyles.addNew}>
                            <SquarePlus />
                            <Link href="/admin/dashboard/addstaff">ADD NEW STAFF</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        {/* Table Header */}
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <Users size={18} />
                            </span>
                            <span>Administrators & Faculty</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading staff data...</div>
                            ) : !staffData?.data || staffData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No staff accounts found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>User Name</th>
                                            <th>Contact</th>
                                            <th>Role</th>
                                            <th>Gender</th>
                                            <th>Status</th>
                                            <th>View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffData.data.map((staff: any, index: number) => (
                                            <tr key={staff.id}>
                                                <td>{((page - 1) * (staffData.per_page || 10)) + index + 1}</td>
                                                <td>
                                                    <div className={tableStyles.profileDiv}>
                                                        <div className={tableStyles.imageDiv}>
                                                            <Image
                                                                src={staff.photo_path || staff.staff_profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                                                                alt="avatar"
                                                                width={40}
                                                                height={40}
                                                                className="rounded-2xl"
                                                            />
                                                        </div>
                                                        <div className={tableStyles.username}>
                                                            <h3>{formatDisplayName(staff.name, staff.title || staff.staff_profile?.title || staff.staffProfile?.title)}</h3>
                                                            <span>{getStaffTitle(staff)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={tableStyles.info}>
                                                    <h3>{staff.email}</h3>
                                                    <span>{getStaffPhone(staff)}</span>
                                                </td>
                                                <td>
                                                    <span className="font-semibold text-gray-700">{getStaffRole(staff)}</span>
                                                </td>
                                                <td>
                                                    <span className="capitalize">{getStaffGender(staff)}</span>
                                                </td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${staff.status === "ACTIVE"
                                                            ? tableStyles.activeStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                                <td className={tableStyles.view}>
                                                    <Link href={`/admin/dashboard/viewstaff/${staff.id}`}>
                                                        <span>VIEW</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {staffData && staffData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {staffData.from} to {staffData.to} of {staffData.total} entries
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-(--primary-color) hover:bg-opacity-90 rounded disabled:opacity-50 cursor-pointer"
                                >
                                    PREVIOUS
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(staffData.last_page, p + 1))}
                                    disabled={page === staffData.last_page}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-(--primary-color) hover:bg-opacity-90 rounded disabled:opacity-50 cursor-pointer"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffPage;