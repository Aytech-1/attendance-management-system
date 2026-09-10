'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { UserCheck, X, RefreshCw } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useStudentDetails, useUpdateStudent, useDepartments } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

const ViewStudentPage = () => {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const { user: authUser } = useAuth();
    const isReadOnlyViewer = authUser?.role === 'Lecturer' || authUser?.role === 'Head of Department';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    
    const studentId = Number(params.id);

    // Fetch details & departments
    const { data: student, isLoading, refetch } = useStudentDetails(studentId);
    const { data: deptData } = useDepartments({ per_page: 100 });
    const updateMutation = useUpdateStudent();

    // States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [matricNumber, setMatricNumber] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [level, setLevel] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (student) {
            const profile = student.student_profile || student.studentProfile || student.profile || {};
            setName(student.name || "");
            setEmail(student.email || "");
            setMatricNumber(student.matric_number || profile.matric_number || "");
            setDepartmentId(student.department_id || profile.department_id ? String(student.department_id || profile.department_id) : "");
            setLevel(student.level || profile.level ? String(student.level || profile.level) : "");
            setPhone(student.phone || profile.phone || "");
            setGender(student.gender || profile.gender || "MALE");
            setStatus(student.status || "ACTIVE");
        }
    }, [student]);

    const genderOptions = [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
    ];

    const levelOptions = [
        { label: "100 Level", value: "100" },
        { label: "200 Level", value: "200" },
        { label: "300 Level", value: "300" },
        { label: "400 Level", value: "400" },
        { label: "500 Level", value: "500" },
    ];

    const statusOptions = [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive / Suspended", value: "INACTIVE" },
    ];

    const departmentOptions = deptData?.data?.map((d: any) => ({
        label: d.name,
        value: String(d.id)
    })) || [];

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isReadOnlyViewer) {
            showToast("Academic staff are not authorized to modify student records.", "error");
            return;
        }

        if (!name.trim() || !email.trim() || !matricNumber.trim() || !departmentId || !level || !phone.trim() || !gender) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                id: studentId,
                payload: {
                    name,
                    email,
                    matric_number: matricNumber,
                    department_id: Number(departmentId),
                    level: Number(level),
                    phone,
                    gender,
                    status,
                    photo_path: student.profile?.photo_path || "/all-images/image-pix/avatar.jpg"
                }
            });
            showToast("Student profile updated successfully!");
            refetch();
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                Object.keys(serverErrors).forEach((key) => {
                    showToast(`Field error '${key}': ${serverErrors[key][0]}`, "error");
                });
            } else {
                showToast(err.response?.data?.message || "Failed to update student profile.", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="absolute right-0 w-112.5 h-full bg-[#f8f8f8] flex justify-center items-center z-50 shadow-2xl">
                <div className="text-gray-500 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-(--secondary-color)" size={20} />
                    Loading Profile...
                </div>
            </div>
        );
    }

    return (
        <div className="absolute right-0 w-112.5 h-full bg-[#f8f8f8] animate__animated animate__fadeInRight shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="h-15 flex items-center justify-center bg-[rgba(250,245,229,0.5)] border-b">
                <div className="w-[90%] flex items-center justify-between">
                    <div className="flex items-center gap-2 ">
                        <div className="text-(--secondary-color)">
                            <UserCheck size={16} />
                        </div>
                        <span className="text-[18px] text-(--secondary-color) font-semibold">STUDENT PROFILE</span>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer text-white text-xs bg-linear-to-r from-[#9d043c] to-[#F5874F] hover:opacity-90 transition"
                    >
                        <X size={14} /> Close
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grow overflow-auto flex flex-col">
                {/* Avatar Banner */}
                <div className="p-5 bg-white border-b flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 relative">
                        <Image
                            src={student?.profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                            alt="profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-base font-bold text-gray-900 leading-tight">
                            {name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                status === "ACTIVE" 
                                    ? "bg-green-50 text-green-700 border border-green-200" 
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">• MATRIC: {matricNumber}</span>
                        </div>
                    </div>
                </div>

                {/* Form fields */}
                <div className="p-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    {isReadOnlyViewer ? "Student Details (Read-Only)" : "Edit Student Details"}
                                </span>
                            </div>

                            <InputField
                                id="studentName"
                                label="Student Name"
                                placeholder="e.g. Ogunleye Opeyemi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                readOnly={isReadOnlyViewer}
                            />

                            <InputField
                                id="matricNumber"
                                label="Matric Number"
                                placeholder="e.g. 4543432345"
                                value={matricNumber}
                                onChange={(e) => setMatricNumber(e.target.value)}
                                readOnly={isReadOnlyViewer}
                            />

                            <SelectField
                                id="studentDept"
                                label="Department"
                                options={departmentOptions}
                                value={departmentId}
                                onChange={setDepartmentId}
                                disabled={isReadOnlyViewer}
                            />

                            <SelectField
                                id="studentLevel"
                                label="Level"
                                options={levelOptions}
                                value={level}
                                onChange={setLevel}
                                disabled={isReadOnlyViewer}
                            />

                            <InputField
                                id="studentEmail"
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly={isReadOnlyViewer}
                            />

                            <InputField
                                id="studentPhone"
                                label="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                readOnly={isReadOnlyViewer}
                            />

                            <SelectField
                                id="studentGender"
                                label="Gender"
                                options={genderOptions}
                                value={gender}
                                onChange={setGender}
                                disabled={isReadOnlyViewer}
                            />

                            <SelectField
                                id="studentStatus"
                                label="Account Status"
                                options={statusOptions}
                                value={status}
                                onChange={setStatus}
                                disabled={isReadOnlyViewer}
                            />

                            {!isReadOnlyViewer && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="update-student-btn"
                                        text={isSaving ? "SAVING..." : "UPDATE STUDENT"}
                                        type="submit"
                                        disabled={isSaving}
                                    />
                                </div>
                            )}

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ViewStudentPage;
