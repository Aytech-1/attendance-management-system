'use client';

import React, { useEffect, useState, use } from 'react';
import styles from "@/styles/component/view-staff.module.css";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { X, UserCheck, RefreshCw } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useStaffDetails, useUpdateStaff, useDepartments } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

import { formatDisplayName } from "@/utils/format-name";

const ViewStaffProfile = () => {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const { user: authUser } = useAuth();
    const isHodViewer = authUser?.role === 'Head of Department';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    
    // Resolve dynamic params
    const staffIdParam = Number(params.staffid);

    // Fetch details & departments list
    const { data: staff, isLoading, refetch } = useStaffDetails(staffIdParam);
    const { data: deptData } = useDepartments({ per_page: 100 });
    const updateMutation = useUpdateStaff();

    // Form states
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [staffCode, setStaffCode] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (staff) {
            const profile = staff.staff_profile || staff.staffProfile || staff.profile || {};
            setTitle(profile.title || staff.title || "MR");
            setName(staff.name || "");
            setEmail(staff.email || "");
            setPhone(staff.phone || profile.phone || "");
            setGender(staff.gender || profile.gender || "MALE");
            setRole(staff.role || "");
            setStatus(staff.status || "ACTIVE");
            setStaffCode(staff.staff_id || profile.staff_id || "");
            setDepartmentId(staff.department_id || profile.department_id ? String(staff.department_id || profile.department_id) : "");
        }
    }, [staff]);

    const titleOptions = [
        { label: "MR", value: "MR" },
        { label: "MRS", value: "MRS" },
        { label: "DR", value: "DR" },
        { label: "PROF", value: "PROF" },
        { label: "ENGR", value: "ENGR" },
    ];

    const genderOptions = [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
    ];

    const roleOptions = [
        { label: "Super Administrator", value: "Super Administrator" },
        { label: "Administrator", value: "Administrator" },
        { label: "Head of Department", value: "Head of Department" },
        { label: "Lecturer", value: "Lecturer" },
    ];

    const statusOptions = [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive / Suspended", value: "INACTIVE" },
    ];

    const isAdminRole = role === "Administrator" || role === "Super Administrator" || role === "Admin" || role === "Super Admin";

    const departmentOptions = isAdminRole
        ? [{ label: "Not Applicable — System-Wide (No Department)", value: "" }]
        : [
            { label: "Select Department...", value: "" },
            ...(deptData?.data?.map((d: any) => ({
                label: d.name,
                value: String(d.id)
            })) || [])
        ];

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isHodViewer) {
            showToast("Head of Department is not authorized to modify staff profiles.", "error");
            return;
        }

        // Validations
        if (!name.trim() || !email.trim() || !phone.trim() || !staffCode.trim() || !role || !gender || !title) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        if (!isAdminRole && !departmentId) {
            showToast("Department selection is required for non-administrative staff.", "error");
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
                id: staffIdParam,
                payload: {
                    name,
                    email,
                    status,
                    role,
                    staff_id: staffCode,
                    department_id: isAdminRole ? null : (departmentId ? Number(departmentId) : null),
                    title,
                    phone,
                    gender,
                    photo_path: staff?.profile?.photo_path || "/all-images/image-pix/avatar.jpg"
                }
            });
            showToast("Staff profile updated successfully!");
            refetch();
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                Object.keys(serverErrors).forEach((key) => {
                    showToast(`Field error '${key}': ${serverErrors[key][0]}`, "error");
                });
            } else {
                showToast(err.response?.data?.message || "Failed to update staff profile.", "error");
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
            <div className="h-15 flex items-center justify-center bg-[rgba(250,245,229,0.5)] border-b border-gray-200">
                <div className="w-[90%] flex items-center justify-between">
                    <div className="flex items-center gap-2 ">
                        <div className="text-(--secondary-color)">
                            <UserCheck size={16} />
                        </div>
                        <span className="text-[18px] text-(--secondary-color) font-semibold">STAFF PROFILE</span>
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
                            src={staff?.profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                            alt="profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-base font-bold text-gray-900 leading-tight">
                            {formatDisplayName(name, title)}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                status === "ACTIVE" 
                                    ? "bg-green-50 text-green-700 border border-green-200" 
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">• ROLE: {role}</span>
                        </div>
                    </div>
                </div>

                {/* Form fields */}
                <div className="p-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    {isHodViewer ? "Staff Details (Read-Only)" : "Edit Basic Information"}
                                </span>
                            </div>

                            <SelectField
                                id="title"
                                label="Title"
                                options={titleOptions}
                                value={title}
                                onChange={setTitle}
                                disabled={isHodViewer}
                            />

                            <InputField
                                id="fullName"
                                label="Full Name"
                                placeholder="e.g. Adeyemi Ayobami Samson"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                readOnly={isHodViewer}
                            />

                            <InputField
                                id="staffCode"
                                label="Staff ID"
                                value={staffCode}
                                onChange={(e) => setStaffCode(e.target.value)}
                                readOnly={isHodViewer}
                            />

                            <SelectField
                                id="role"
                                label="Security Role"
                                options={roleOptions}
                                value={role}
                                onChange={(val) => {
                                    setRole(val);
                                    if (val === "Administrator" || val === "Super Administrator" || val === "Admin" || val === "Super Admin") {
                                        setDepartmentId("");
                                    }
                                }}
                                disabled={isHodViewer}
                            />

                            <SelectField
                                id="staffDept"
                                label="Department"
                                options={departmentOptions}
                                value={departmentId}
                                onChange={setDepartmentId}
                                disabled={isHodViewer || isAdminRole}
                            />

                            <InputField
                                id="email"
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly={isHodViewer}
                            />

                            <InputField
                                id="phone"
                                label="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                readOnly={isHodViewer}
                            />

                            <SelectField
                                id="gender"
                                label="Gender"
                                options={genderOptions}
                                value={gender}
                                onChange={setGender}
                                disabled={isHodViewer}
                            />

                            <SelectField
                                id="status"
                                label="Account Status"
                                options={statusOptions}
                                value={status}
                                onChange={setStatus}
                                disabled={isHodViewer}
                            />

                            {!isHodViewer && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="update-btn"
                                        text={isSaving ? "SAVING..." : "UPDATE PROFILE"}
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

export default ViewStaffProfile;