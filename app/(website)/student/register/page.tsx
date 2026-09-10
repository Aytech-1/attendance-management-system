'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import { LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { useStudentRegister, useDepartments } from "@/components/api/client";
import { z } from 'zod';

// Synchronized Zod validation schema matching Laravel StudentController publicRegister validation
const studentRegisterSchema = z.object({
    name: z.string().trim().min(2, "Full Name must be at least 2 characters long."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    matric_number: z.string().trim().min(3, "Matric Number is required."),
    department_id: z.string().min(1, "Please select your department."),
    level: z.string().min(1, "Please select your level."),
    phone: z.string().trim().min(10, "Please enter a valid phone number (min 10 digits)."),
    gender: z.enum(["MALE", "FEMALE"], { message: "Please select your gender." }),
});

export default function StudentRegisterPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const registerMutation = useStudentRegister();
    const { data: deptData } = useDepartments({ per_page: 100 });

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [matricNumber, setMatricNumber] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [level, setLevel] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const departmentOptions = deptData?.data?.map((d: any) => ({
        label: d.name,
        value: String(d.id)
    })) || [];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) return;

        setErrors({});

        // Execute Zod Schema Validation
        const result = studentRegisterSchema.safeParse({
            name,
            email,
            password,
            matric_number: matricNumber,
            department_id: departmentId,
            level,
            phone,
            gender: gender as any,
        });

        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            let firstErrorFieldId = '';

            result.error.issues.forEach((issue, idx) => {
                const fieldName = String(issue.path[0]);
                if (!formattedErrors[fieldName]) {
                    formattedErrors[fieldName] = issue.message;
                }
                if (idx === 0) {
                    firstErrorFieldId = fieldName === 'matric_number' ? 'regMatric'
                        : fieldName === 'department_id' ? 'regDept'
                        : fieldName === 'name' ? 'regName'
                        : fieldName === 'email' ? 'regEmail'
                        : fieldName === 'password' ? 'regPassword'
                        : fieldName === 'level' ? 'regLevel'
                        : fieldName === 'phone' ? 'regPhone'
                        : 'regGender';
                }
            });

            setErrors(formattedErrors);
            showToast("Please correct the highlighted errors below.", "error");

            // Focus & smooth scroll to the first invalid field
            if (firstErrorFieldId && typeof document !== 'undefined') {
                const el = document.getElementById(firstErrorFieldId);
                if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        setIsSubmitting(true);
        try {
            await registerMutation.mutateAsync({
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                matric_number: matricNumber.trim(),
                department_id: Number(departmentId),
                level: Number(level),
                phone: phone.trim(),
                gender,
            });

            showToast("Student registration successful. Welcome!");
            router.push("/student/dashboard");
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors && typeof serverErrors === 'object') {
                const mapped: Record<string, string> = {};
                Object.keys(serverErrors).forEach((key) => {
                    mapped[key] = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
                });
                setErrors(mapped);
                showToast("Server validation failed. Please fix highlighted fields.", "error");
            } else {
                showToast(err.response?.data?.message || "Registration failed. Please try again.", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f7f5] flex justify-center items-center py-10 px-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6 flex flex-col items-center">
                
                {/* Logo */}
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center mb-4 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/all-images/image-pix/logo.png?v=2"
                        alt="NACOS Institution Logo"
                        className="w-16 h-16 object-contain"
                    />
                </div>

                <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                    Student Registration
                </h1>
                <p className="text-xs text-gray-500 text-center mb-6 font-semibold uppercase tracking-wider">
                    Create your attendance account
                </p>

                <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
                    <div>
                        <InputField
                            id="regName"
                            label="Full Name"
                            placeholder="e.g. Ogunleye Opeyemi"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                        />
                        {errors.name && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.name}</span>}
                    </div>

                    <div>
                        <InputField
                            id="regEmail"
                            label="Email Address"
                            placeholder="e.g. student@instit.edu"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                        />
                        {errors.email && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.email}</span>}
                    </div>

                    <div>
                        <InputField
                            id="regPassword"
                            label="Password (min 8 chars)"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                            }}
                        />
                        {errors.password && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.password}</span>}
                    </div>

                    <div>
                        <InputField
                            id="regMatric"
                            label="Matric Number"
                            placeholder="e.g. 4543432345"
                            value={matricNumber}
                            onChange={(e) => {
                                setMatricNumber(e.target.value);
                                if (errors.matric_number) setErrors(prev => ({ ...prev, matric_number: '' }));
                            }}
                        />
                        {errors.matric_number && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.matric_number}</span>}
                    </div>

                    <div>
                        <SelectField
                            id="regDept"
                            label="Select Department"
                            options={departmentOptions}
                            value={departmentId}
                            onChange={(val) => {
                                setDepartmentId(val);
                                if (errors.department_id) setErrors(prev => ({ ...prev, department_id: '' }));
                            }}
                        />
                        {errors.department_id && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.department_id}</span>}
                    </div>

                    <div>
                        <SelectField
                            id="regLevel"
                            label="Select Level"
                            options={levelOptions}
                            value={level}
                            onChange={(val) => {
                                setLevel(val);
                                if (errors.level) setErrors(prev => ({ ...prev, level: '' }));
                            }}
                        />
                        {errors.level && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.level}</span>}
                    </div>

                    <div>
                        <InputField
                            id="regPhone"
                            label="Phone Number"
                            placeholder="e.g. 09055556666"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                            }}
                        />
                        {errors.phone && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.phone}</span>}
                    </div>

                    <div>
                        <SelectField
                            id="regGender"
                            label="Select Gender"
                            options={genderOptions}
                            value={gender}
                            onChange={(val) => {
                                setGender(val);
                                if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                            }}
                        />
                        {errors.gender && <span className="text-[11px] text-red-500 font-semibold mt-1 block">{errors.gender}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 flex justify-center items-center gap-2 bg-[#004B29] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-opacity-95 transition mt-2 shadow-md uppercase disabled:opacity-50"
                    >
                        <UserPlus size={14} />
                        {isSubmitting ? "CREATING ACCOUNT..." : "REGISTER ACCOUNT"}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/student/login')}
                        className="w-full h-11 flex justify-center items-center gap-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-50 transition uppercase"
                    >
                        <LogIn size={14} />
                        Back to Login
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] text-gray-400 font-semibold">
                    © 2026 QR Attendance System • Powered by Laragon & Next.js
                </div>
            </div>
        </div>
    );
}
