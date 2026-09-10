'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useCreateStudent, useDepartments } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

const AddStudentPage = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { user: profile } = useAuth();

    useEffect(() => {
        if (profile && (profile.role === 'Lecturer' || profile.role === 'Head of Department')) {
            showToast("Academic staff are not authorized to register students.", "error");
            router.replace('/admin/dashboard/students');
        }
    }, [profile, router, showToast]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    const createMutation = useCreateStudent();

    // Fetch departments for selection
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = "Student Full Name is required.";
        if (!email.trim()) newErrors.email = "Email Address is required.";
        if (!password.trim()) newErrors.password = "Password is required.";
        if (!matricNumber.trim()) newErrors.matricNumber = "Matric Number is required.";
        if (!departmentId) newErrors.departmentId = "Department selection is required.";
        if (!level) newErrors.level = "Level selection is required.";
        if (!phone.trim()) newErrors.phone = "Phone Number is required.";
        if (!gender) newErrors.gender = "Gender selection is required.";

        if (password.trim() && password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            showToast("Please fill in all required student fields.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync({
                name,
                email,
                password,
                matric_number: matricNumber,
                department_id: Number(departmentId),
                level: Number(level),
                phone,
                gender,
            });
            showToast("Student account registered successfully.");
            router.push('/admin/dashboard/students');
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                const mapped: Record<string, string> = {};
                if (serverErrors.name) mapped.name = serverErrors.name[0];
                if (serverErrors.email) mapped.email = serverErrors.email[0];
                if (serverErrors.password) mapped.password = serverErrors.password[0];
                if (serverErrors.matric_number) mapped.matricNumber = serverErrors.matric_number[0];
                if (serverErrors.department_id) mapped.departmentId = serverErrors.department_id[0];
                if (serverErrors.level) mapped.level = serverErrors.level[0];
                if (serverErrors.phone) mapped.phone = serverErrors.phone[0];
                if (serverErrors.gender) mapped.gender = serverErrors.gender[0];
                setFieldErrors(mapped);
                showToast("Please fix the errors in the highlighted fields.", "error");
            } else {
                showToast(err.response?.data?.message || "Failed to register student.", "error");
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
                            <UserPlus size={16} className="text-white" />
                        </div>
                        <div className="text-[18px] text-(--secondary-color) font-semibold">
                            CREATE NEW STUDENT
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
                    Kindly fill the form below to register a new Student.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleSubmit} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <UserPlus size={18} className="text-(--primary-color)" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Student Registration Details
                                </span>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <InputField
                                        id="studentName"
                                        label="Student Full Name"
                                        placeholder="e.g. Ogunleye Opeyemi"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })); }}
                                    />
                                    {fieldErrors.name && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.name}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="studentEmail"
                                        label="Email Address"
                                        placeholder="e.g. opeyemi@gmail.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                                    />
                                    {fieldErrors.email && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.email}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="studentPassword"
                                        label="Password"
                                        placeholder="Minimum 8 characters"
                                        type="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                                    />
                                    {fieldErrors.password && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.password}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="matricNumber"
                                        label="Matric Number"
                                        placeholder="e.g. 4543432345"
                                        value={matricNumber}
                                        onChange={(e) => { setMatricNumber(e.target.value); setFieldErrors(prev => ({ ...prev, matricNumber: '' })); }}
                                    />
                                    {fieldErrors.matricNumber && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.matricNumber}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="studentDept"
                                        label="Department"
                                        options={departmentOptions}
                                        value={departmentId}
                                        onChange={(val) => { setDepartmentId(val); setFieldErrors(prev => ({ ...prev, departmentId: '' })); }}
                                    />
                                    {fieldErrors.departmentId && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.departmentId}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="studentLevel"
                                        label="Level"
                                        options={levelOptions}
                                        value={level}
                                        onChange={(val) => { setLevel(val); setFieldErrors(prev => ({ ...prev, level: '' })); }}
                                    />
                                    {fieldErrors.level && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.level}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="studentPhone"
                                        label="Phone Number"
                                        placeholder="e.g. 09055556666"
                                        value={phone}
                                        onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                                    />
                                    {fieldErrors.phone && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.phone}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="studentGender"
                                        label="Gender"
                                        options={genderOptions}
                                        value={gender}
                                        onChange={(val) => { setGender(val); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                                    />
                                    {fieldErrors.gender && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.gender}</span>}
                                </div>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="submit-student-btn"
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

export default AddStudentPage;
