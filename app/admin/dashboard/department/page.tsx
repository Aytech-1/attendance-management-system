'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useDepartments, useArchiveDepartment, useRestoreDepartment } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { SquarePlus, Building2, Eye, Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const DepartmentPage = () => {
    const { showToast } = useToast();
    const router = useRouter();
    const { user: profile } = useAuth();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        if (profile && (profile.role === 'Head of Department' || profile.role === 'Lecturer')) {
            router.replace('/admin/dashboard');
        }
    }, [profile, router]);

    // Archive confirmation modal state
    const [archiveTarget, setArchiveTarget] = useState<{ id: number; code: string } | null>(null);

    // Fetch departments
    const { data: deptData, isLoading, refetch } = useDepartments({
        search,
        page,
        archived: showArchived,
    });

    const archiveMutation = useArchiveDepartment();
    const restoreMutation = useRestoreDepartment();

    const handleRestore = async (id: number, code: string) => {
        try {
            await restoreMutation.mutateAsync(id);
            showToast(`Department ${code} restored successfully.`);
            refetch();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to restore department.', 'error');
        }
    };

    return (
        <div className="w-full flex flex-col font-sans">
            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <Building2 />
                    </div>
                    <div className={styles.headerText}>
                        <h2>Departments</h2>
                        <p>
                            View and manage all academic departments, create new departments, 
                            toggle active status, archive inactive ones, or restore them.
                        </p>
                    </div>
                </div>

                <div className={styles.staffHeader}>
                    <div className={styles.searchInput}>
                        <input 
                            className={styles.input}
                            type="text"
                            placeholder="Search Departments..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowArchived(!showArchived); setPage(1); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer transition"
                        >
                            {showArchived ? 'VIEW ACTIVE' : 'VIEW ARCHIVED'}
                        </button>
                        
                        <div className={styles.addNew}>
                            <SquarePlus />
                            <Link href="/admin/dashboard/adddepartment">ADD DEPARTMENT</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <Building2 size={18} />
                            </span>
                            <span>{showArchived ? 'Archived Departments' : 'Active Departments'}</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading departments...</div>
                            ) : !deptData?.data || deptData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No departments found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>Department Code</th>
                                            <th>Department Name</th>
                                            <th>Date Created</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptData.data.map((dept: any, index: number) => (
                                            <tr key={dept.id}>
                                                <td>{((page - 1) * (deptData.per_page || 10)) + index + 1}</td>
                                                <td>
                                                    <span className="font-semibold text-gray-800">{dept.code}</span>
                                                </td>
                                                <td>{dept.name}</td>
                                                <td>{new Date(dept.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${dept.status === "ACTIVE"
                                                            ? tableStyles.activeStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {dept.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-3">
                                                        <Link href={`/admin/dashboard/viewdepartment/${dept.id}`} className="text-gray-500 hover:text-(--secondary-color)">
                                                            <Eye size={16} />
                                                        </Link>
                                                        {showArchived ? (
                                                            <button 
                                                                onClick={() => handleRestore(dept.id, dept.code)} 
                                                                className="text-green-600 hover:text-green-800 cursor-pointer"
                                                                title="Restore Department"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => setArchiveTarget({ id: dept.id, code: dept.code })} 
                                                                className="text-amber-600 hover:text-amber-800 cursor-pointer border-0 bg-transparent p-0"
                                                                title="Archive Department"
                                                            >
                                                                <Archive size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {deptData && deptData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {deptData.from} to {deptData.to} of {deptData.total} entries
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
                                    onClick={() => setPage(p => Math.min(deptData.last_page, p + 1))}
                                    disabled={page === deptData.last_page}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-(--primary-color) hover:bg-opacity-90 rounded disabled:opacity-50 cursor-pointer"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Modal Confirmation for Archiving */}
            {archiveTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col text-center animate__animated animate__zoomIn">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Archive Department</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-6">
                            Are you sure you want to archive department <strong>{archiveTarget.code}</strong>? 
                            No classes can schedule sessions under it while inactive.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setArchiveTarget(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await archiveMutation.mutateAsync(archiveTarget.id);
                                        showToast(`Department ${archiveTarget.code} archived successfully.`);
                                        refetch();
                                    } catch (err: any) {
                                        showToast(err.response?.data?.message || 'Failed to archive department.', 'error');
                                    } finally {
                                        setArchiveTarget(null);
                                    }
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                                YES, ARCHIVE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentPage;
