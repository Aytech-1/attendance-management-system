'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useParams } from "next/navigation";
import { Building2, X, RefreshCw } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useDepartmentDetails, useUpdateDepartment } from "@/components/api/client";

const ViewDepartmentPage = () => {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    
    const deptId = Number(params.id);

    const { data: dept, isLoading, refetch } = useDepartmentDetails(deptId);
    const updateMutation = useUpdateDepartment();

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (dept) {
            setName(dept.name || "");
            setCode(dept.code || "");
            setStatus(dept.status || "ACTIVE");
        }
    }, [dept]);

    const statusOptions = [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive / Suspended", value: "INACTIVE" },
    ];

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !code.trim()) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                id: deptId,
                payload: {
                    name,
                    code,
                    status
                }
            });
            showToast("Department updated successfully!");
            refetch();
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                Object.keys(serverErrors).forEach((key) => {
                    showToast(`Field error '${key}': ${serverErrors[key][0]}`, "error");
                });
            } else {
                showToast(err.response?.data?.message || "Failed to update department.", "error");
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
                    Loading Department...
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
                            <Building2 size={16} />
                        </div>
                        <span className="text-[18px] text-(--secondary-color) font-semibold">DEPARTMENT DETAILS</span>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer text-white text-xs bg-linear-to-r from-[#9d043c] to-[#F5874F] hover:opacity-90 transition"
                    >
                        <X size={14} /> Close
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="grow overflow-auto flex flex-col">
                <p className="px-5 py-3 text-sm text-(--link-color) bg-[rgba(250,245,229,0.5)] border-b shadow-xs">
                    View or edit the academic department code and name configuration.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleUpdate} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Building2 size={18} className="text-(--primary-color)" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Edit Department Details
                                </span>
                            </div>

                            <InputField
                                id="deptName"
                                label="Department Name"
                                placeholder="e.g. COMPUTER SCIENCE"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <InputField
                                id="deptCode"
                                label="Department Code"
                                placeholder="e.g. CSC"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={10}
                            />

                            <SelectField
                                id="deptStatus"
                                label="Status"
                                options={statusOptions}
                                value={status}
                                onChange={setStatus}
                            />

                            <div className="flex justify-center mt-4">
                                <Button
                                    id="update-dept-btn"
                                    text={isSaving ? "SAVING..." : "UPDATE DEPARTMENT"}
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

export default ViewDepartmentPage;
