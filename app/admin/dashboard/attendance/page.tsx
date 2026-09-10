'use client';

import React, { useState } from 'react';
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useAttendanceHistory, useDepartments, useCourses, apiClient } from "@/components/api/client";
import { ClipboardList, Download, RefreshCw } from "lucide-react";
import SelectField from "@/components/ui/select-field";
import InputField from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast-provider";

const AttendanceHistoryPage = () => {
    const { showToast } = useToast();
    const [page, setPage] = useState(1);
    const [departmentId, setDepartmentId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [status, setStatus] = useState('');
    const [date, setDate] = useState('');

    const { data: deptData } = useDepartments({ per_page: 100 });
    const { data: courseData } = useCourses({ per_page: 100 });
    
    const { data: attendanceData, isLoading, refetch } = useAttendanceHistory({
        page,
        department_id: departmentId,
        course_id: courseId,
        status,
        date,
    });

    const departmentOptions = [
        { label: "All Departments", value: "" },
        ...(deptData?.data?.map((d: any) => ({ label: d.name, value: String(d.id) })) || [])
    ];

    const courseOptions = [
        { label: "All Courses", value: "" },
        ...(courseData?.data?.map((c: any) => ({ label: `[${c.code}] ${c.name}`, value: String(c.id) })) || [])
    ];

    const statusOptions = [
        { label: "All Statuses", value: "" },
        { label: "PRESENT", value: "PRESENT" },
        { label: "LATE", value: "LATE" },
        { label: "ABSENT", value: "ABSENT" },
        { label: "EXCUSED", value: "EXCUSED" },
    ];

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            showToast("Generating CSV report...", "info");
            const response = await apiClient.get('/attendance/export', {
                params: {
                    department_id: departmentId || undefined,
                    course_id: courseId || undefined,
                    status: status || undefined,
                    date: date || undefined,
                },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            showToast("Attendance report downloaded successfully!");
        } catch (err: any) {
            showToast("Failed to download attendance report. Please try again.", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const getStudentName = (log: any) => {
        return (log.student_name && log.student_name !== 'N/A')
            ? log.student_name
            : (log.student?.name || log.student_data?.name || log.user?.name || 'Not Available');
    };

    const getMatricNumber = (log: any) => {
        return (log.matric_number && log.matric_number !== 'N/A')
            ? log.matric_number
            : (
                log.student?.student_profile?.matric_number ||
                log.student?.studentProfile?.matric_number ||
                log.student_data?.matric_number ||
                'Not Available'
            );
    };

    const getDepartmentName = (log: any) => {
        return (log.department_name && log.department_name !== 'N/A')
            ? log.department_name
            : (
                log.student?.student_profile?.department?.name ||
                log.student?.studentProfile?.department?.name ||
                log.lecture_session?.course?.department?.name ||
                log.student_data?.department?.name ||
                'Not Available'
            );
    };

    return (
        <div className="w-full flex flex-col">
            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <ClipboardList />
                    </div>
                    <div className={styles.headerText}>
                        <h2>Attendance logs</h2>
                        <p>
                            Verify student logs, view history, filter by date, course, department, 
                            and export reports to CSV.
                        </p>
                    </div>
                </div>

                <div className={styles.staffHeader}>
                    <div className="flex gap-2 flex-wrap items-center">
                        <div className="w-48">
                            <SelectField
                                id="historyDept"
                                label=""
                                options={departmentOptions}
                                value={departmentId}
                                onChange={(val) => { setDepartmentId(val); setPage(1); }}
                            />
                        </div>

                        <div className="w-48">
                            <SelectField
                                id="historyCourse"
                                label=""
                                options={courseOptions}
                                value={courseId}
                                onChange={(val) => { setCourseId(val); setPage(1); }}
                            />
                        </div>

                        <div className="w-36">
                            <SelectField
                                id="historyStatus"
                                label=""
                                options={statusOptions}
                                value={status}
                                onChange={(val) => { setStatus(val); setPage(1); }}
                            />
                        </div>

                        <div className="w-40 pt-1">
                            <InputField
                                id="historyDate"
                                label=""
                                type="date"
                                value={date}
                                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                            />
                        </div>

                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#004B29] text-white text-xs font-semibold rounded-lg hover:bg-opacity-95 cursor-pointer transition h-10 mt-1"
                        >
                            <Download size={14} /> EXPORT CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <ClipboardList size={18} />
                            </span>
                            <span>Attendance Logs</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-(--secondary-color)" size={18} />
                                    Loading history...
                                </div>
                            ) : !attendanceData?.data || attendanceData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No attendance logs found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>STUDENT NAME</th>
                                            <th>MATRIC NUMBER</th>
                                            <th>DEPARTMENT</th>
                                            <th>COURSE CODE</th>
                                            <th>COURSE NAME</th>
                                            <th>SCANNED DATE & TIME</th>
                                            <th>METHOD</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.data.map((log: any, index: number) => (
                                            <tr key={log.id}>
                                                <td>{((page - 1) * (attendanceData.per_page || 10)) + index + 1}</td>
                                                <td>{getStudentName(log)}</td>
                                                <td>{getMatricNumber(log)}</td>
                                                <td>{getDepartmentName(log)}</td>
                                                <td>
                                                    <span className="font-semibold text-gray-800">{log.lecture_session?.course?.code || 'N/A'}</span>
                                                </td>
                                                <td>{log.lecture_session?.course?.name || 'N/A'}</td>
                                                <td>{log.scanned_at ? new Date(log.scanned_at).toLocaleString() : 'N/A'}</td>
                                                <td>{log.method}</td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${log.status === "PRESENT"
                                                            ? tableStyles.activeStatus
                                                            : log.status === "LATE"
                                                            ? tableStyles.inactiveStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {attendanceData && attendanceData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {attendanceData.from} to {attendanceData.to} of {attendanceData.total} entries
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
                                    onClick={() => setPage(p => Math.min(attendanceData.last_page, p + 1))}
                                    disabled={page === attendanceData.last_page}
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

export default AttendanceHistoryPage;
