'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useCreateStaff, useDepartments } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

const AddStaffPage = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { user: profile } = useAuth();

    useEffect(() => {
        if (profile && profile.role === 'Head of Department') {
            showToast("Head of Department is not authorized to create staff members.", "error");
            router.replace('/admin/dashboard/staff');
        }
    }, [profile, router, showToast]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    const createMutation = useCreateStaff();
    const { data: deptData } = useDepartments({ per_page: 100 });

    const [title, setTitle] = useState("");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState("");
    const [role, setRole] = useState("");
    const [staffId, setStaffId] = useState(() => `STF/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    const [password, setPassword] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        // Input validations
        const newErrors: Record<string, string> = {};
        if (!title) newErrors.title = "Please select a title.";
        if (!firstName.trim()) newErrors.firstName = "First Name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last Name is required.";
        if (!email.trim()) newErrors.email = "Email Address is required.";
        if (!role) newErrors.role = "Please assign a staff security role.";
        if (!staffId.trim()) newErrors.staffId = "Staff ID Code is required.";
        if (!password.trim()) newErrors.password = "Account Password is required.";

        if (!isAdminRole && !departmentId) {
            newErrors.departmentId = "Please select an academic department.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim() && !emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (password.trim() && password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            showToast("Please fix the highlighted input errors.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const fullName = `${title} ${lastName} ${firstName} ${middleName}`.replace(/\s+/g, ' ').trim();

            await createMutation.mutateAsync({
                name: fullName,
                email,
                password,
                status: "ACTIVE",
                role,
                staff_id: staffId,
                department_id: isAdminRole ? null : (departmentId ? Number(departmentId) : null),
                title,
                phone,
                gender,
                photo_path: "/all-images/image-pix/avatar.jpg"
            });

            showToast("Staff account created and assigned successfully!");
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                const mappedErrors: Record<string, string> = {};
                Object.keys(serverErrors).forEach((key) => {
                    const msg = serverErrors[key][0];
                    if (key === 'email') mappedErrors.email = msg;
                    else if (key === 'staff_id') mappedErrors.staffId = msg;
                    else if (key === 'name') mappedErrors.firstName = msg;
                    else if (key === 'department_id') mappedErrors.departmentId = msg;
                    else if (key === 'password') mappedErrors.password = msg;
                    else if (key === 'role') mappedErrors.role = msg;
                    else mappedErrors[key] = msg;
                });
                setFieldErrors(mappedErrors);
                showToast("Please correct the errors in the highlighted fields.", "error");
            } else {
                showToast(err.response?.data?.message || "Failed to create staff account.", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute right-0 w-112.5 h-full bg-[#f8f8f8] animate__animated animate__fadeInRight shadow-2xl flex flex-col z-50">
            {/* Drawer Header */}
            <div className="h-15 flex items-center justify-center bg-[rgba(250,245,229,0.5)] border-b">
                <div className="w-[90%] flex items-center justify-between">
                    <div className="flex items-center gap-2 ">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-linear-to-r from-[#9d043c] to-[#F5874F]">
                            <UserPlus size={16} className="text-white" />
                        </div>
                        <div className="text-[18px] text-(--secondary-color) font-semibold">
                            CREATE NEW STAFF
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

            {/* Content Drawer Form */}
            <div className="grow overflow-auto flex flex-col">
                <p className="px-5 py-3 text-sm text-(--link-color) bg-[rgba(250,245,229,0.5)] border-b shadow-xs">
                    Complete all administrative and personal fields to create a staff record.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleSubmit} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <UserPlus size={18} className="text-(--primary-color)" />
                                <span className="text-sm text-gray-500 font-medium font-sans">
                                    Staff Registration Form
                                </span>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <SelectField
                                        id="title"
                                        label="Select Title"
                                        options={titleOptions}
                                        value={title}
                                        onChange={(val) => { setTitle(val); setFieldErrors(prev => ({ ...prev, title: '' })); }}
                                    />
                                    {fieldErrors.title && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.title}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="firstName"
                                        label="First Name"
                                        required={true}
                                        placeholder="e.g. Opeyemi"
                                        value={firstName}
                                        onChange={(e) => { setFirstName(e.target.value); setFieldErrors(prev => ({ ...prev, firstName: '', name: '' })); }}
                                    />
                                    {(fieldErrors.firstName || fieldErrors.name) && (
                                        <span className="text-red-500 text-xs font-semibold mt-1 block">
                                            {fieldErrors.firstName || fieldErrors.name}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <InputField
                                        id="middleName"
                                        label="Middle Name (Optional)"
                                        required={false}
                                        placeholder="e.g. Samson"
                                        value={middleName}
                                        onChange={(e) => setMiddleName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <InputField
                                        id="lastName"
                                        label="Last Name"
                                        required={true}
                                        placeholder="e.g. Ogunleye"
                                        value={lastName}
                                        onChange={(e) => { setLastName(e.target.value); setFieldErrors(prev => ({ ...prev, lastName: '' })); }}
                                    />
                                    {fieldErrors.lastName && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.lastName}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="staffId"
                                        label="Staff ID Code"
                                        required={true}
                                        placeholder="e.g. STF/2026/001"
                                        value={staffId}
                                        onChange={(e) => { setStaffId(e.target.value); setFieldErrors(prev => ({ ...prev, staffId: '', staff_id: '' })); }}
                                    />
                                    {(fieldErrors.staffId || fieldErrors.staff_id) && (
                                        <span className="text-red-500 text-xs font-semibold mt-1 block">
                                            {fieldErrors.staffId || fieldErrors.staff_id}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <SelectField
                                        id="staffDept"
                                        label="Select Department"
                                        options={departmentOptions}
                                        value={departmentId}
                                        onChange={(val) => { setDepartmentId(val); setFieldErrors(prev => ({ ...prev, departmentId: '', department_id: '' })); }}
                                        disabled={isAdminRole}
                                    />
                                    {(fieldErrors.departmentId || fieldErrors.department_id) && (
                                        <span className="text-red-500 text-xs font-semibold mt-1 block">
                                            {fieldErrors.departmentId || fieldErrors.department_id}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <InputField
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                        required={true}
                                        placeholder="e.g. staff@instit.edu"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                                    />
                                    {fieldErrors.email && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.email}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="password"
                                        label="Account Password"
                                        type="password"
                                        required={true}
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                                    />
                                    {fieldErrors.password && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.password}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="phone"
                                        label="Phone Number"
                                        required={false}
                                        placeholder="e.g. 09012345678"
                                        value={phone}
                                        onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                                    />
                                    {fieldErrors.phone && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.phone}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="address"
                                        label="Home Address"
                                        required={false}
                                        placeholder="e.g. 12 Campus Way Road"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <SelectField
                                        id="gender"
                                        label="Select Gender"
                                        options={genderOptions}
                                        value={gender}
                                        onChange={(val) => { setGender(val); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                                    />
                                    {fieldErrors.gender && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.gender}</span>}
                                </div>

                                <div className="bg-green-50 p-4 border border-green-200 rounded flex flex-col gap-4">
                                    <span className="text-green-800 text-[11px] font-bold uppercase tracking-wider">
                                        ADMINISTRATIVE ACCESS CONTROL
                                    </span>
                                    <div>
                                        <SelectField
                                            id="role"
                                            label="Assign Security Role"
                                            options={roleOptions}
                                            value={role}
                                            onChange={(val) => {
                                                setRole(val);
                                                setFieldErrors(prev => ({ ...prev, role: '', departmentId: '', department_id: '' }));
                                                if (val === "Administrator" || val === "Super Administrator" || val === "Admin" || val === "Super Admin") {
                                                    setDepartmentId("");
                                                }
                                            }}
                                        />
                                        {fieldErrors.role && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.role}</span>}
                                    </div>
                                </div>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="submit-staff-btn"
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

export default AddStaffPage;