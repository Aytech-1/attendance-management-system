'use client';

import React, { useState } from 'react';
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useSessions, useEndSession, LectureSessionRecord } from "@/components/api/client";
import Link from "next/link";
import { SquarePlus, GraduationCap, Play, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const SessionPage = () => {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Confirmation modal state
    const [endTargetId, setEndTargetId] = useState<number | null>(null);

    const { data: sessionData, isLoading, refetch } = useSessions({
        search,
        page,
    });

    const endSessionMutation = useEndSession();

    return (
        <div className="w-full flex flex-col font-sans">
            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <GraduationCap />
                    </div>
                    <div className={styles.headerText}>
                        <h2>Lecture Sessions</h2>
                        <p>
                            Schedule new sessions, project secure dynamic QR codes in classrooms, 
                            and monitor check-ins live.
                        </p>
                    </div>
                </div>

                <div className={styles.staffHeader}>
                    <div className={styles.searchInput}>
                        <input 
                            className={styles.input}
                            type="text"
                            placeholder="Search Course..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className={styles.addNew}>
                        <SquarePlus />
                        <Link href="/admin/dashboard/addsession">ADD NEW SESSION</Link>
                    </div>
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <GraduationCap size={18} />
                            </span>
                            <span>Lecture Sessions</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading sessions...</div>
                            ) : !sessionData?.data || sessionData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No lecture sessions found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>ACADEMIC SESSION</th>
                                            <th>COURSE CODE</th>
                                            <th>COURSE NAME</th>
                                            <th>LECTURER</th>
                                            <th>LOCATION</th>
                                            <th>DATE</th>
                                            <th>TIME WINDOW</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessionData.data.map((session: any, index: number) => (
                                            <tr key={session.id}>
                                                <td>{((page - 1) * (sessionData.per_page || 10)) + index + 1}</td>
                                                <td>
                                                    <span className="font-semibold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        {session.academic_session?.name || session.academicSession?.name || '2025/2026'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="font-semibold text-gray-800">{session.course?.code || 'N/A'}</span>
                                                </td>
                                                <td>{session.course?.name || 'N/A'}</td>
                                                <td>{session.lecturer?.name || 'N/A'}</td>
                                                <td>{session.location || 'N/A'}</td>
                                                <td>{session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</td>
                                                <td>{session.start_time ? session.start_time.slice(0,5) : '00:00'} - {session.end_time ? session.end_time.slice(0,5) : '00:00'}</td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${session.status === "ACTIVE"
                                                            ? tableStyles.activeStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {session.status === 'ACTIVE' ? (
                                                            <>
                                                                <Link 
                                                                    href={`/admin/dashboard/session/${session.id}/project`}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#004B29] rounded hover:bg-opacity-95 transition"
                                                                >
                                                                    <Play size={10} /> PROJECT QR
                                                                </Link>
                                                                <button 
                                                                    onClick={() => setEndTargetId(session.id)}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition cursor-pointer border-0 bg-transparent"
                                                                >
                                                                    <ShieldAlert size={10} /> END
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 font-medium">SESSION COMPLETED</span>
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

                    {sessionData && sessionData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {sessionData.from} to {sessionData.to} of {sessionData.total} entries
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
                                    onClick={() => setPage(p => Math.min(sessionData.last_page, p + 1))}
                                    disabled={page === sessionData.last_page}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-(--primary-color) hover:bg-opacity-90 rounded disabled:opacity-50 cursor-pointer"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Modal Confirmation for Ending Session */}
            {endTargetId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col text-center animate__animated animate__zoomIn">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">End Lecture Session</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-6">
                            Are you sure you want to end this lecture session? No more student check-ins will be allowed.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setEndTargetId(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await endSessionMutation.mutateAsync(endTargetId);
                                        showToast("Lecture session ended successfully.");
                                        refetch();
                                    } catch (err: any) {
                                        showToast(err.response?.data?.message || "Failed to end session.", "error");
                                    } finally {
                                        setEndTargetId(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                                YES, END SESSION
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionPage;
