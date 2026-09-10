'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GraduationCap, X } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useCreateSession, useDepartments, useCourses, useStaffList, useAcademicSessions, useCurrentAcademicSession } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import { formatDisplayName } from "@/utils/format-name";

const AddSessionPage = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { user: profile } = useAuth();

    const isLecturer = profile?.role === 'Lecturer';
    const isHod = profile?.role === 'Head of Department';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
    const createMutation = useCreateSession();

    // Fetch lists conditionally: do NOT fetch departments or staff list for Lecturer role
    const { data: deptData } = useDepartments({ per_page: 100 }, { enabled: !isLecturer });
    const { data: courseData } = useCourses({ per_page: 100 });
    const { data: staffData } = useStaffList({ role: 'Lecturer', per_page: 100 }, { enabled: !isLecturer });
    const { data: academicData } = useAcademicSessions({ per_page: 50 });
    const { data: currentAcademic } = useCurrentAcademicSession();

    const [academicSessionId, setAcademicSessionId] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [courseId, setCourseId] = useState("");
    const [lecturerId, setLecturerId] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [geofenceRadius, setGeofenceRadius] = useState("50");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lecturerDeptId = String(
        (profile as any)?.staff_profile?.department_id ||
        (profile as any)?.staffProfile?.department_id ||
        (profile as any)?.department_id ||
        ''
    );
    const lecturerDeptName =
        (profile as any)?.staff_profile?.department?.name ||
        (profile as any)?.staffProfile?.department?.name ||
        (profile as any)?.department_name ||
        'Assigned Department';

    const lecturerDisplayName = formatDisplayName(
        profile?.name || 'Lecturer',
        (profile as any)?.staff_profile?.title || (profile as any)?.staffProfile?.title
    );

    // Auto-set current academic session and lecturer defaults on load
    useEffect(() => {
        if (currentAcademic?.id && !academicSessionId) {
            setAcademicSessionId(String(currentAcademic.id));
        }
        if (isLecturer) {
            if (lecturerDeptId) setDepartmentId(lecturerDeptId);
            if (profile?.id) setLecturerId(String(profile.id));
        }
    }, [currentAcademic, academicSessionId, isLecturer, lecturerDeptId, profile]);

    const academicOptions = academicData?.data?.map((a: any) => ({
        label: a.name + (a.is_current ? ' (Current Active)' : ''),
        value: String(a.id)
    })) || [];

    const radiusOptions = [
        { label: "Disabled", value: "" },
        { label: "20 Meters geofence", value: "20" },
        { label: "50 Meters geofence (Recommended)", value: "50" },
        { label: "100 Meters geofence", value: "100" },
        { label: "200 Meters geofence", value: "200" },
    ];

    const departmentOptions = deptData?.data?.map((d: any) => ({
        label: d.name,
        value: String(d.id)
    })) || [];

    const courseOptions = courseData?.data
        ?.filter((c: any) => !departmentId || String(c.department_id) === departmentId)
        ?.map((c: any) => ({
            label: `[${c.code}] ${c.name}`,
            value: String(c.id)
        })) || [];

    const lecturerOptions = staffData?.data
        ?.filter((s: any) => !departmentId || String(s.department_id || s.staff_profile?.department_id || s.staffProfile?.department_id) === departmentId)
        ?.map((s: any) => ({
            label: formatDisplayName(s.name, s.title || s.staff_profile?.title || s.staffProfile?.title),
            value: String(s.id)
        })) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isLecturer && !departmentId) {
            showToast("Department is required. Suggestion: Please pick an academic department.", "error");
            return;
        }
        if (!courseId) {
            showToast("Course is required. Suggestion: Select an assigned course.", "error");
            return;
        }
        if (!isLecturer && !lecturerId) {
            showToast("Lecturer assignment is required. Suggestion: Select the lecturer hosting this class.", "error");
            return;
        }
        if (!date) {
            showToast("Session Date is required. Suggestion: Pick the scheduled date of the lecture.", "error");
            return;
        }

        if (!startTime) {
            showToast("Start Time is required. Suggestion: Select the lecture start time using the browser time picker.", "error");
            return;
        }
        if (!endTime) {
            showToast("End Time is required. Suggestion: Select the lecture end time. It must be later than the start time.", "error");
            return;
        }

        if (startTime >= endTime) {
            showToast("Time range is invalid. Suggestion: End Time must be after Start Time.", "error");
            return;
        }

        if (!location.trim()) {
            showToast("Location Name is required. Suggestion: Specify classroom or building (e.g. 'Lab 3').", "error");
            return;
        }

        // Optional lat/lng checks if filled
        if (latitude.trim() !== '') {
            const latNum = Number(latitude);
            if (isNaN(latNum) || latNum < -90 || latNum > 90) {
                showToast("Latitude is invalid. Suggestion: Must be a number between -90 and 90.", "error");
                return;
            }
        }
        if (longitude.trim() !== '') {
            const lngNum = Number(longitude);
            if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
                showToast("Longitude is invalid. Suggestion: Must be a number between -180 and 180.", "error");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                academic_session_id: academicSessionId ? Number(academicSessionId) : undefined,
                course_id: Number(courseId),
                date,
                start_time: startTime,
                end_time: endTime,
                location,
                latitude: latitude.trim() !== '' ? Number(latitude) : null,
                longitude: longitude.trim() !== '' ? Number(longitude) : null,
                geofence_radius: geofenceRadius.trim() !== '' ? Number(geofenceRadius) : 50,
            };

            if (!isLecturer && departmentId) {
                payload.department_id = Number(departmentId);
            }
            if (!isLecturer && lecturerId) {
                payload.lecturer_id = Number(lecturerId);
            }

            await createMutation.mutateAsync(payload);
            showToast("Lecture session created successfully.");
            router.back();
        } catch (err: any) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                Object.keys(serverErrors).forEach((key) => {
                    showToast(`Server validation error on '${key}': ${serverErrors[key][0]}`, "error");
                });
            } else {
                showToast(err.response?.data?.message || "Failed to schedule lecture session.", "error");
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
                            <GraduationCap size={16} className="text-white" />
                        </div>
                        <div className="text-[18px] text-(--secondary-color) font-semibold">
                            CREATE NEW SESSION
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
                <p className="px-5 py-3 text-sm text-(--link-color) bg-[rgba(250,245,229,0.5)] border-b">
                    Kindly fill the form below to schedule a Lecture Session.
                </p>

                <div className="flex justify-center py-5 bg-[#f8f8f8] grow">
                    <form onSubmit={handleSubmit} className="w-[90%] flex flex-col gap-5">
                        <div className="bg-white rounded shadow p-5 flex flex-col gap-5">
                            
                            <div className="flex items-center gap-2 border-b pb-2">
                                <GraduationCap size={18} className="text-(--primary-color)" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Lecture Session Setup
                                </span>
                            </div>

                            <div className="flex flex-col gap-5">
                                {academicOptions.length > 0 && (
                                    <SelectField
                                        id="sessionAcademic"
                                        label="Academic Session"
                                        options={academicOptions}
                                        value={academicSessionId}
                                        onChange={setAcademicSessionId}
                                    />
                                )}

                                {isLecturer ? (
                                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col gap-1 text-xs">
                                        <div className="flex justify-between items-center text-amber-900 font-semibold">
                                            <span>Lecturer: {lecturerDisplayName}</span>
                                            <span>Department: {lecturerDeptName}</span>
                                        </div>
                                        <p className="text-[10px] text-amber-700 font-medium">Session will be automatically associated with your identity and department.</p>
                                    </div>
                                ) : !isHod ? (
                                    <SelectField
                                        id="sessionDept"
                                        label="Select Department"
                                        options={departmentOptions}
                                        value={departmentId}
                                        onChange={(val) => { setDepartmentId(val); setCourseId(''); }}
                                    />
                                ) : (
                                    <div className="px-3.5 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold">
                                        Department: {lecturerDeptName}
                                    </div>
                                )}

                                <SelectField
                                    id="sessionCourse"
                                    label="Select Course"
                                    options={courseOptions}
                                    value={courseId}
                                    onChange={setCourseId}
                                />

                                {!isLecturer && (
                                    <SelectField
                                        id="sessionLecturer"
                                        label="Assign Lecturer"
                                        options={lecturerOptions}
                                        value={lecturerId}
                                        onChange={setLecturerId}
                                    />
                                )}

                                <InputField
                                    id="sessionDate"
                                    label="Session Date"
                                    type="date"
                                    required={true}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                <span className="text-[10px] text-gray-400 -mt-3.5 px-1 font-semibold">
                                    Suggestion: Pick the scheduled date of the lecture.
                                </span>

                                <div className="flex gap-4">
                                    <div className="w-1/2 flex flex-col gap-1.5">
                                        <InputField
                                            id="sessionStart"
                                            label="Start Time (24h)"
                                            type="time"
                                            required={true}
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                        <span className="text-[9px] text-gray-400 px-1 font-semibold">
                                            Suggestion: Select the lecture start time using the browser time picker.
                                        </span>
                                    </div>
                                    <div className="w-1/2 flex flex-col gap-1.5">
                                        <InputField
                                            id="sessionEnd"
                                            label="End Time (24h)"
                                            type="time"
                                            required={true}
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                        />
                                        <span className="text-[9px] text-gray-400 px-1 font-semibold">
                                            Suggestion: Select the lecture end time. It must be later than the start time.
                                        </span>
                                    </div>
                                </div>

                                <InputField
                                    id="sessionLocation"
                                    label="Location Name"
                                    required={true}
                                    placeholder="e.g. Lecture Hall B / Lab 3"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />

                                <div className="bg-amber-50 p-4 border border-amber-200 rounded flex flex-col gap-4">
                                    <span className="text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                                        GEOLOCATION CONTROL (GEOCONSTRAINT)
                                    </span>
                                    <div className="flex gap-4">
                                        <div className="w-1/2 flex flex-col gap-1.5">
                                            <InputField
                                                id="latitude"
                                                label="Latitude (Optional)"
                                                required={false}
                                                placeholder="e.g. 6.8924"
                                                value={latitude}
                                                onChange={(e) => setLatitude(e.target.value)}
                                            />
                                            <span className="text-[9px] text-amber-800/60 px-1 font-semibold">
                                                Suggestion: Room coordinate latitude
                                            </span>
                                        </div>
                                        <div className="w-1/2 flex flex-col gap-1.5">
                                            <InputField
                                                id="longitude"
                                                label="Longitude (Optional)"
                                                required={false}
                                                placeholder="e.g. 3.7225"
                                                value={longitude}
                                                onChange={(e) => setLongitude(e.target.value)}
                                            />
                                            <span className="text-[9px] text-amber-800/60 px-1 font-semibold">
                                                Suggestion: Room coordinate longitude
                                            </span>
                                        </div>
                                    </div>
                                    <SelectField
                                        id="geofenceRadius"
                                        label="Geofence Validation Radius"
                                        options={radiusOptions}
                                        value={geofenceRadius}
                                        onChange={setGeofenceRadius}
                                    />
                                </div>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        id="submit-session-btn"
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

export default AddSessionPage;
