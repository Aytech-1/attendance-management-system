'use client';

import React, { useEffect, useState } from 'react';
import styles from "@/styles/component/view-staff.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, UserCheck, RefreshCw } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useProfile, useUpdateStaff, useDepartments } from "@/components/api/client";

import { formatDisplayName } from "@/utils/format-name";

const ViewStaffProfile = () => {
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    // Query hooks
    const { data: user, isLoading: isUserLoading, refetch } = useProfile();
    const { data: deptData } = useDepartments({ per_page: 100 });
    const updateMutation = useUpdateStaff();

    // States
    const [title, setTitle] = useState("MR");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState("MALE");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [staffIdCode, setStaffIdCode] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Prepopulate inputs once user is loaded
    useEffect(() => {
        if (user) {
            const profile = user.profile;
            setTitle(profile?.title || "MR");
            
            // Smart name parser: "MR Ayobami Samson Adeyemi" -> title MR, last Adeyemi, first Ayobami, middle Samson
            const nameParts = (user.name || "").split(" ");
            let startIdx = 0;
            // Skip title word if matches
            if (["MR", "MRS", "DR", "PROF", "ENGR"].includes(nameParts[0]?.toUpperCase())) {
                startIdx = 1;
            }
            const remainingParts = nameParts.slice(startIdx);
            if (remainingParts.length > 0) {
                setLastName(remainingParts[remainingParts.length - 1] || "");
            }
            if (remainingParts.length > 1) {
                setFirstName(remainingParts[0] || "");
            }
            if (remainingParts.length > 2) {
                setMiddleName(remainingParts.slice(1, -1).join(" ") || "");
            }

            setEmail(user.email || "");
            setPhone(profile?.phone || "");
            setAddress(profile?.address || "");
            setGender(profile?.gender || "MALE");
            setRole(user.role || "");
            setStatus(typeof user.status === 'string' ? user.status : user.status?.statusName || "ACTIVE");
            setStaffIdCode(profile?.staff_id || "");
            setDepartmentId(profile?.department_id ? String(profile.department_id) : "");
        }
    }, [user]);

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

    const departmentOptions = [
        { label: "No Assigned Department", value: "" },
        ...(deptData?.data?.map((d: any) => ({
            label: d.name,
            value: String(d.id)
        })) || [])
    ];

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !staffIdCode.trim()) {
            showToast("Please fill in all required profile fields.", "error");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const fullName = `${title} ${lastName} ${firstName} ${middleName}`.replace(/\s+/g, ' ').trim();

            await updateMutation.mutateAsync({
                id: user.id!,
                payload: {
                    name: fullName,
                    email,
                    status,
                    role,
                    staff_id: staffIdCode,
                    department_id: departmentId ? Number(departmentId) : null,
                    title,
                    phone,
                    gender,
                    photo_path: user.profile?.photo_path || "/all-images/image-pix/avatar.jpg"
                }
            });

            showToast("Your profile details updated successfully!");
            refetch();
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                Object.keys(serverErrors).forEach((key) => {
                    showToast(`Error in '${key}': ${serverErrors[key][0]}`, "error");
                });
            } else {
                showToast(err.response?.data?.message || "Failed to save profile changes.", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="absolute right-0 w-112.5 h-full bg-[#f8f8f8] flex justify-center items-center z-50 shadow-2xl">
                <div className="text-gray-500 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-(--secondary-color)" size={20} />
                    Fetching profile...
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
                        <span className="text-[18px] text-(--secondary-color) font-semibold font-sans">MY PROFILE</span>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer text-white text-xs bg-linear-to-r from-[#9d043c] to-[#F5874F] hover:opacity-90 transition animate-pulse"
                    >
                        <X size={14} /> Close
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grow overflow-auto flex flex-col font-sans">
                {/* Banner */}
                <div className="p-5 bg-white border-b flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 relative">
                        <Image
                            src={user?.profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                            alt="profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-base font-bold text-gray-900 leading-tight">
                            {formatDisplayName(`${lastName} ${firstName}`, title)}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                {status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">• ID: {staffIdCode}</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    Your Profile Information
                                </span>
                            </div>

                            <SelectField
                                id="title"
                                label="Title"
                                options={titleOptions}
                                value={title}
                                onChange={setTitle}
                            />

                            <InputField
                                id="firstName"
                                label="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />

                            <InputField
                                id="middleName"
                                label="Middle Name (Optional)"
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                            />

                            <InputField
                                id="lastName"
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />

                            <InputField
                                id="staffCode"
                                label="Staff ID"
                                value={staffIdCode}
                                onChange={(e) => setStaffIdCode(e.target.value)}
                            />

                            <SelectField
                                id="staffDept"
                                label="Department"
                                options={departmentOptions}
                                value={departmentId}
                                onChange={setDepartmentId}
                            />

                            <InputField
                                id="email"
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <InputField
                                id="phone"
                                label="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />

                            <InputField
                                id="address"
                                label="Home Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />

                            <SelectField
                                id="gender"
                                label="Gender"
                                options={genderOptions}
                                value={gender}
                                onChange={setGender}
                            />

                            <InputField
                                id="role"
                                label="Security Role"
                                value={role}
                                readOnly
                            />

                            <div className="flex justify-center mt-4">
                                <Button
                                    id="save-profile-btn"
                                    text={isSaving ? "SAVING CHANGES..." : "SAVE CHANGES"}
                                    type="submit"
                                    disabled={isSaving}
                                />
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ViewStaffProfile;