'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PlusCircle, X } from "lucide-react";
import InputField from "@/components/ui/text-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useCreateDepartment } from "@/components/api/client";

const AddDepartmentPage = () => {
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    const createMutation = useCreateDepartment();

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = "Department Name is required.";
        if (!code.trim()) newErrors.code = "Department Code is required.";

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            showToast("Please fill in all required fields.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync({
                name,
                code,
            });
            showToast("Department created successfully.");
            router.push('/admin/dashboard/department');
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                const mapped: Record<string, string> = {};
                if (serverErrors.name) mapped.name = serverErrors.name[0];
                if (serverErrors.code) mapped.code = serverErrors.code[0];
                setFieldErrors(mapped);
                showToast("Please fix the highlighted field errors.", "error");
            } else {
                showToast(err.response?.data?.message || "Failed to create department.", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute right-0 w-112.5 h-full bg-[#f8f8f8] animate__animated animate__fadeInRight shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="h-15 flex items-center justify-center bg-[rgba(250,245,229,0.5)] border-b border-gray-200">
                <div className="w-[90%] flex items-center justify-between">
                    <div className="flex items-center gap-2 ">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-linear-to-r from-[#9d043c] to-[#F5874F]">
                            <PlusCircle size={16} className="text-white" />
                        </div>
                        <div className="text-[18px] text-(--secondary-color) font-semibold">
                            ADD NEW DEPARTMENT
                        </div>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer text-white text-xs bg-linear-to-r from-[#9d043c] to-[#F5874F] hover:opacity-90 transition"
                    >
                        <X size={14} /> Close
                    </button>
                </div>
            </div>

            {/* Content Form */}
            <div className="grow overflow-auto flex flex-col">
                <p className="px-5 py-3 text-sm text-(--link-color) bg-[rgba(250,245,229,0.5)] border-b">
                    Kindly fill the form below to Add New Department.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleSubmit} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <PlusCircle size={18} className="text-(--primary-color)" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Department Registration Details
                                </span>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <InputField
                                        id="departmentName"
                                        label="Department Name"
                                        placeholder="e.g. COMPUTER SCIENCE"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })); }}
                                    />
                                    {fieldErrors.name && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.name}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="departmentCode"
                                        label="Department Code"
                                        placeholder="e.g. CSC"
                                        value={code}
                                        onChange={(e) => { setCode(e.target.value); setFieldErrors(prev => ({ ...prev, code: '' })); }}
                                        maxLength={10}
                                    />
                                    {fieldErrors.code && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.code}</span>}
                                </div>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="submit-dept-btn"
                                        text={isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                                        type="submit"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddDepartmentPage;
