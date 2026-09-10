'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, X, Sparkles } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useCreateCourse, useUpdateCourse, useCourses, useDepartments, useStaffList } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

const AddCoursePage = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { user: profile } = useAuth();
    const isHod = profile?.role === 'Head of Department';
    const hodDeptId = (profile as any)?.staff_profile?.department_id || (profile as any)?.profile?.department_id || (profile as any)?.department_id;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    
    const createMutation = useCreateCourse();
    const updateMutation = useUpdateCourse();

    // Query existing courses, departments, and filtered staff/lecturers
    const { data: courseData } = useCourses({ per_page: 200 });
    const { data: deptData } = useDepartments({ per_page: 100 });

    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [departmentId, setDepartmentId] = useState<string>(() => (isHod && hodDeptId) ? String(hodDeptId) : "");
    const [lecturerId, setLecturerId] = useState("");
    const [level, setLevel] = useState("");
    const [creditUnit, setCreditUnit] = useState("");
    const [semester, setSemester] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isHod && hodDeptId) {
            setDepartmentId(String(hodDeptId));
        }
    }, [isHod, hodDeptId]);

    // Fetch lecturers filtered dynamically by the selected department
    const { data: staffData } = useStaffList({ 
        role: 'Lecturer', 
        department_id: departmentId || undefined,
        per_page: 100 
    });

    // Handle course selection to autofill all details
    const handleCourseSelect = (courseId: string) => {
        setSelectedCourseId(courseId);
        if (!courseId) {
            // Reset fields for new course creation
            setCode("");
            setName("");
            setDepartmentId((isHod && hodDeptId) ? String(hodDeptId) : "");
            setLecturerId("");
            setLevel("");
            setCreditUnit("");
            setSemester("");
            return;
        }

        const course = courseData?.data?.find((c: any) => String(c.id) === String(courseId));
        if (course) {
            setCode(course.code || "");
            setName(course.name || "");
            const deptIdStr = course.department_id ? String(course.department_id) : "";
            setDepartmentId(deptIdStr);
            setLevel(course.level ? String(course.level) : "");
            setCreditUnit(course.credit_unit ? String(course.credit_unit) : "");
            setSemester(course.semester || "");
            setLecturerId(course.lecturer_id ? String(course.lecturer_id) : "");

            showToast(`Selected course: ${course.code}`);
        }
    };

    // Auto-detect typed course code matching
    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        setFieldErrors(prev => ({ ...prev, code: '' }));
        const matchingCourse = courseData?.data?.find(
            (c: any) => c.code.toLowerCase().trim() === newCode.toLowerCase().trim()
        );
        if (matchingCourse) {
            setSelectedCourseId(String(matchingCourse.id));
            setName(matchingCourse.name || "");
            setDepartmentId(matchingCourse.department_id ? String(matchingCourse.department_id) : "");
            setLevel(matchingCourse.level ? String(matchingCourse.level) : "");
            setCreditUnit(matchingCourse.credit_unit ? String(matchingCourse.credit_unit) : "");
            setSemester(matchingCourse.semester || "");
            setLecturerId(matchingCourse.lecturer_id ? String(matchingCourse.lecturer_id) : "");
        }
    };

    const levelOptions = [
        { label: "100 Level", value: "100" },
        { label: "200 Level", value: "200" },
        { label: "300 Level", value: "300" },
        { label: "400 Level", value: "400" },
        { label: "500 Level", value: "500" },
    ];

    const creditUnitOptions = [
        { label: "1 Credit Unit", value: "1" },
        { label: "2 Credit Units", value: "2" },
        { label: "3 Credit Units", value: "3" },
        { label: "4 Credit Units", value: "4" },
        { label: "5 Credit Units", value: "5" },
        { label: "6 Credit Units", value: "6" },
    ];

    const semesterOptions = [
        { label: "First Semester", value: "FIRST" },
        { label: "Second Semester", value: "SECOND" },
    ];

    const courseOptions = courseData?.data?.map((c: any) => ({
        label: `${c.code} - ${c.name}`,
        value: String(c.id)
    })) || [];

    const departmentOptions = deptData?.data?.map((d: any) => ({
        label: d.name,
        value: String(d.id)
    })) || [];

    const lecturerOptions = staffData?.data?.map((s: any) => ({
        label: `${s.title || ''} ${s.name}`.trim(),
        value: String(s.id)
    })) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const newErrors: Record<string, string> = {};
        if (!code.trim()) newErrors.code = "Course Code is required.";
        if (!name.trim()) newErrors.name = "Course Name is required.";
        if (!departmentId) newErrors.departmentId = "Department selection is required.";
        if (!level) newErrors.level = "Level selection is required.";
        if (!creditUnit) newErrors.creditUnit = "Credit Unit selection is required.";
        if (!semester) newErrors.semester = "Semester selection is required.";

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            showToast("Please fill in all required course fields.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                code: code.trim().toUpperCase(),
                name: name.trim(),
                department_id: Number(departmentId),
                lecturer_id: lecturerId ? Number(lecturerId) : null,
                level: Number(level),
                credit_unit: Number(creditUnit),
                semester,
            };

            if (selectedCourseId) {
                await updateMutation.mutateAsync({
                    id: Number(selectedCourseId),
                    payload
                });
                showToast("Course details and lecturer assignment updated successfully!");
            } else {
                await createMutation.mutateAsync(payload);
                showToast("New course registered and assigned successfully!");
            }
            
            router.push('/admin/dashboard/course');
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                const mapped: Record<string, string> = {};
                if (serverErrors.code) mapped.code = serverErrors.code[0];
                if (serverErrors.name) mapped.name = serverErrors.name[0];
                if (serverErrors.department_id) mapped.departmentId = serverErrors.department_id[0];
                if (serverErrors.level) mapped.level = serverErrors.level[0];
                if (serverErrors.credit_unit) mapped.creditUnit = serverErrors.credit_unit[0];
                if (serverErrors.semester) mapped.semester = serverErrors.semester[0];
                setFieldErrors(mapped);
                showToast("Please correct the errors in the highlighted fields.", "error");
            } else {
                showToast(err.response?.data?.message || "Failed to save course details.", "error");
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
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#004B29]">
                            <BookOpen size={15} className="text-white" />
                        </div>
                        <div className="text-[17px] text-[#004B29] font-bold font-sans">
                            {selectedCourseId ? "ASSIGN LECTURER / EDIT COURSE" : "CREATE & ASSIGN COURSE"}
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
            <div className="grow overflow-auto flex flex-col font-sans">
                <p className="px-5 py-3 text-xs text-[#004B29] bg-[#ebf5ec] border-b flex items-center gap-1.5 font-semibold">
                    <Sparkles size={14} />
                    Select a course to autofill details or register a new course below.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleSubmit} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col gap-5">
                            
                            {/* Select Course Dropdown */}
                            <SelectField
                                id="selectCourse"
                                label="Select Course"
                                options={courseOptions}
                                value={selectedCourseId}
                                onChange={handleCourseSelect}
                            />

                            <div className="flex items-center gap-2 border-b pb-2 mt-1">
                                <BookOpen size={16} className="text-[#004B29]" />
                                <span className="text-xs text-gray-700 font-bold uppercase tracking-wider">
                                    Course Details & Assignments
                                </span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <InputField
                                        id="courseCode"
                                        label="Course Code"
                                        placeholder="e.g. CSC101"
                                        value={code}
                                        onChange={(e) => handleCodeChange(e.target.value)}
                                        maxLength={15}
                                    />
                                    {fieldErrors.code && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.code}</span>}
                                </div>

                                <div>
                                    <InputField
                                        id="courseName"
                                        label="Course Name"
                                        placeholder="e.g. INTRO TO COMPUTER SCIENCE"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })); }}
                                    />
                                    {fieldErrors.name && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.name}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="department"
                                        label="Select Department"
                                        options={departmentOptions}
                                        value={departmentId}
                                        onChange={(val) => {
                                            if (!isHod) {
                                                setDepartmentId(val);
                                                setLecturerId("");
                                                setFieldErrors(prev => ({ ...prev, departmentId: '' }));
                                            }
                                        }}
                                        disabled={isHod}
                                    />
                                    {fieldErrors.departmentId && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.departmentId}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="lecturer"
                                        label="Assign Lecturer"
                                        options={lecturerOptions}
                                        value={lecturerId}
                                        onChange={setLecturerId}
                                    />
                                </div>

                                <div>
                                    <SelectField
                                        id="level"
                                        label="Select Level"
                                        options={levelOptions}
                                        value={level}
                                        onChange={(val) => { setLevel(val); setFieldErrors(prev => ({ ...prev, level: '' })); }}
                                    />
                                    {fieldErrors.level && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.level}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="creditUnit"
                                        label="Credit Units"
                                        options={creditUnitOptions}
                                        value={creditUnit}
                                        onChange={(val) => { setCreditUnit(val); setFieldErrors(prev => ({ ...prev, creditUnit: '' })); }}
                                    />
                                    {fieldErrors.creditUnit && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.creditUnit}</span>}
                                </div>

                                <div>
                                    <SelectField
                                        id="semester"
                                        label="Select Semester"
                                        options={semesterOptions}
                                        value={semester}
                                        onChange={(val) => { setSemester(val); setFieldErrors(prev => ({ ...prev, semester: '' })); }}
                                    />
                                    {fieldErrors.semester && <span className="text-red-500 text-xs font-semibold mt-1 block">{fieldErrors.semester}</span>}
                                </div>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="submit-course-btn"
                                        text={isSubmitting ? "SAVING..." : (selectedCourseId ? "UPDATE & ASSIGN LECTURER" : "CREATE & ASSIGN COURSE")}
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

export default AddCoursePage;
