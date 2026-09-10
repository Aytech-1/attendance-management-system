'use client';

import React, { useState } from 'react';
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useStudents, useDepartments, useCourses } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import Image from "next/image";
import { SquarePlus, Users } from "lucide-react";
import SelectField from "@/components/ui/select-field";

const StudentPage = () => {
    const { user: profile } = useAuth();
    const isLecturer = profile?.role === 'Lecturer';
    const isHod = profile?.role === 'Head of Department';
    const isAcademicStaff = isLecturer || isHod;

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [departmentId, setDepartmentId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [level, setLevel] = useState('');

    const { data: deptData } = useDepartments({ per_page: 100 });
    const { data: courseData } = useCourses({ per_page: 100 });
    const { data: studentData, isLoading } = useStudents({
        search,
        page,
        department_id: isAcademicStaff ? undefined : departmentId,
        course_id: courseId,
        level,
    });

    const departmentOptions = [
        { label: "All Departments", value: "" },
        ...(deptData?.data?.map((d: { id: number; name: string }) => ({ label: d.name, value: String(d.id) })) || [])
    ];

    const courseOptions = [
        { label: "All My Courses", value: "" },
        ...(courseData?.data?.map((c: { id: number; code: string; name: string }) => ({ 
            label: `${c.code} - ${c.name}`, 
            value: String(c.id) 
        })) || [])
    ];

    const levelOptions = [
        { label: "All Levels", value: "" },
        { label: "100 Level", value: "100" },
        { label: "200 Level", value: "200" },
        { label: "300 Level", value: "300" },
        { label: "400 Level", value: "400" },
        { label: "500 Level", value: "500" },
    ];

    const userDeptName = (profile as any)?.staff_profile?.department?.name || (profile as any)?.department_name || (profile as any)?.department?.name || 'Department Scoped';

    const getStudentMatric = (student: Record<string, any>) => {
        return (
            student.matric_number ||
            student.student_profile?.matric_number ||
            student.studentProfile?.matric_number ||
            'N/A'
        );
    };

    const getStudentPhone = (student: any) => {
        return (
            student.phone ||
            student.student_profile?.phone ||
            student.studentProfile?.phone ||
            'N/A'
        );
    };

    const getStudentLevel = (student: any) => {
        return (
            student.level ||
            student.student_profile?.level ||
            student.studentProfile?.level ||
            'N/A'
        );
    };

    const getStudentDept = (student: any) => {
        return (
            student.department_code ||
            student.department_name ||
            student.department?.code ||
            student.department?.name ||
            student.student_profile?.department?.code ||
            student.studentProfile?.department?.code ||
            'N/A'
        );
    };

    return (
        <div className="w-full flex flex-col">
            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <Users />
                    </div>
                    <div className={styles.headerText}>
                        <h2>Students</h2>
                        <p>
                            {isLecturer 
                                ? `Viewing students assigned to your courses (${userDeptName}).`
                                : isHod
                                ? `Viewing department students (${userDeptName}).`
                                : "Manage student records, view enrollments, filter by levels and department, and control system access details."
                            }
                        </p>
                    </div>
                </div>

                <div className={styles.staffHeader}>
                    <div className={styles.searchInput}>
                        <input 
                            className={styles.input}
                            type="text"
                            placeholder="Search Student..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="flex gap-2 items-center">
                        {isLecturer ? (
                            <div className="w-56">
                                <SelectField
                                    id="filter-course"
                                    label=""
                                    options={courseOptions}
                                    value={courseId}
                                    onChange={(val) => { setCourseId(val); setPage(1); }}
                                />
                            </div>
                        ) : !isHod ? (
                            <div className="w-48">
                                <SelectField
                                    id="filter-dept"
                                    label=""
                                    options={departmentOptions}
                                    value={departmentId}
                                    onChange={(val) => { setDepartmentId(val); setPage(1); }}
                                />
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold">
                                {userDeptName}
                            </div>
                        )}
                        
                        <div className="w-36">
                            <SelectField
                                id="filter-level"
                                label=""
                                options={levelOptions}
                                value={level}
                                onChange={(val) => { setLevel(val); setPage(1); }}
                            />
                        </div>

                        {!isAcademicStaff && (
                            <div className={styles.addNew}>
                                <SquarePlus />
                                <Link href="/admin/dashboard/addstudent">ADD NEW STUDENT</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>
                    <div className={tableStyles.tableContentDiv}>
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <Users size={18} />
                            </span>
                            <span>Students</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            {isLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading students...</div>
                            ) : !studentData?.data || studentData.data.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">No students found.</div>
                            ) : (
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th>User Name</th>
                                            <th>Contact</th>
                                            <th>Level</th>
                                            <th>Department</th>
                                            <th>Date Registered</th>
                                            <th>Status</th>
                                            <th>View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentData.data.map((student: any, index: number) => (
                                            <tr key={student.id}>
                                                <td>{((page - 1) * (studentData.per_page || 10)) + index + 1}</td>
                                                <td>
                                                    <div className={tableStyles.profileDiv}>
                                                        <div className={tableStyles.imageDiv}>
                                                            <Image
                                                                src={student.photo_path || student.student_profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                                                                alt="avatar"
                                                                width={40}
                                                                height={40}
                                                                className="rounded-2xl"
                                                            />
                                                        </div>
                                                        <div className={tableStyles.username}>
                                                            <h3>{student.name}</h3>
                                                            <span>{getStudentMatric(student)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={tableStyles.info}>
                                                    <h3>{student.email}</h3>
                                                    <span>{getStudentPhone(student)}</span>
                                                </td>
                                                <td>{getStudentLevel(student)}</td>
                                                <td>{getStudentDept(student)}</td>
                                                <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`
                                                        ${tableStyles.status}
                                                        ${student.status === "ACTIVE"
                                                            ? tableStyles.activeStatus
                                                            : tableStyles.inactiveStatus
                                                        }
                                                    `}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                                <td className={tableStyles.view}>
                                                    <Link href={`/admin/dashboard/viewstudent/${student.id}`}>
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

                    {studentData && studentData.last_page > 1 && (
                        <div className="flex justify-between items-center mt-5 px-5">
                            <span className="text-sm text-gray-500">
                                Showing {studentData.from} to {studentData.to} of {studentData.total} entries
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
                                    onClick={() => setPage(p => Math.min(studentData.last_page, p + 1))}
                                    disabled={page === studentData.last_page}
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

export default StudentPage;
