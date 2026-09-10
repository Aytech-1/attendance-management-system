'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useCourses } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { SquarePlus, BookOpen, PlusCircle } from "lucide-react";

const CoursePage = () => {
    const router = useRouter();
    const { user: profile } = useAuth();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (profile && profile.role === 'Lecturer') {
            router.replace('/admin/dashboard');
        }
    }, [profile, router]);

    // Fetch courses data
    const { data: courseData, isLoading } = useCourses({
        search,
        page,
    });

    // Compute active vs suspended counts
    const activeCount = courseData?.data?.filter((c: any) => c.status === 'ACTIVE').length || 0;
    const suspendedCount = courseData?.data?.filter((c: any) => c.status === 'INACTIVE').length || 0;

    return (
        <div className="w-full flex flex-col">
            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <BookOpen />
                    </div>
                    <div className={styles.headerText}>
                        <h2>Course</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Active: {activeCount} | Suspended: {suspendedCount}
                        </p>
                    </div>
                </div>

                <div className={styles.staffHeader}>
                    <div className={styles.searchInput}>
                        <input 
                            className={styles.input}
                            type="text"
                            placeholder="Type here to search course..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="flex gap-2.5">
                        <div className={styles.addNew}>
                            <SquarePlus />
                            <Link href="/admin/dashboard/addcourse">ADD NEW COURSE</Link>
                        </div>
                        
                        <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#004B29] text-white text-xs font-semibold rounded-lg hover:bg-opacity-95 transition cursor-pointer">
                            <PlusCircle size={14} />
                            <Link href="/admin/dashboard/addcourse">ASSIGNED LECTURER TO COURSE</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <BookOpen size={18} />
                            </span>
                            <span>Courses</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading courses...</div>
                            ) : !courseData?.data || courseData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No courses found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>COURSE CODE</th>
                                            <th>COURSE NAME</th>
                                            <th>LEVEL</th>
                                            <th>CREDIT UNIT</th>
                                            <th>SEMESTER</th>
                                            <th>ASSIGNED LECTURER</th>
                                            <th>DATE</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courseData.data.map((course: any, index: number) => (
                                            <tr key={course.id}>
                                                <td>{((page - 1) * (courseData.per_page || 10)) + index + 1}</td>
                                                <td>
                                                    <span className="font-semibold text-gray-800">{course.code}</span>
                                                </td>
                                                <td>{course.name}</td>
                                                <td>{course.level}</td>
                                                <td>{course.credit_unit}</td>
                                                <td>{course.semester}</td>
                                                <td>{course.lecturer?.name || 'NOT ASSIGNED'}</td>
                                                <td>{new Date(course.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${course.status === "ACTIVE"
                                                            ? tableStyles.activeStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {course.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {courseData && courseData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {courseData.from} to {courseData.to} of {courseData.total} entries
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
                                    onClick={() => setPage(p => Math.min(courseData.last_page, p + 1))}
                                    disabled={page === courseData.last_page}
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

export default CoursePage;
