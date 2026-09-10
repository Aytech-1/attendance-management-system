'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAttendanceHistory } from "@/components/api/client";
import { useAuth } from '@/components/auth-provider';
import { LogOut, ScanQrCode, ClipboardCheck, Award, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast-provider';
import LogoutModal from '@/components/ui/logout-modal';

export default function StudentDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, isLoading: isProfileLoading, isAuthenticated } = useAuth();
    const { data: attendanceData, isLoading: isHistoryLoading } = useAttendanceHistory();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        // Only evaluate redirect AFTER authentication hydration has completed
        if (!isProfileLoading && !isAuthenticated) {
            router.replace('/student/login');
        }
    }, [isAuthenticated, isProfileLoading, router]);

    if (isProfileLoading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#e8f3ed] via-[#f4f8f5] to-[#ffffff] flex justify-center items-center font-sans text-gray-500 text-xs font-semibold">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#004B29] border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading student portal...</span>
                </div>
            </div>
        );
    }

    const studentName = user.name;
    const matricNumber = user.profile?.matric_number || 'N/A';
    const departmentName = user.profile?.department?.name || 'N/A';
    const studentLevel = user.profile?.level || 'N/A';
    const totalPresent = attendanceData?.total || 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e8f3ed] via-[#f4f8f5] to-[#ffffff] font-sans pb-12 pt-6 sm:pt-10 flex flex-col items-center px-4">
            
            {/* Top Navigation Bar with spacing */}
            <div className="w-full max-w-lg bg-[#004B29] text-white py-4 px-6 shadow-xl rounded-2xl flex justify-between items-center border border-white/10">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/all-images/image-pix/logo.png?v=2" alt="Logo" className="w-8 h-8 object-contain" />
                    <div className="flex flex-col">
                        <span className="font-extrabold text-sm tracking-wide leading-none">STUDENT PORTAL</span>
                        <span className="text-[10px] text-white/70 font-semibold mt-1">NACOS Smart Attendance</span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer text-white flex items-center gap-1 text-xs font-semibold"
                    title="Log Out"
                >
                    <LogOut size={15} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                redirectPath="/student/login"
            />

            {/* Main Content Area with Spacing */}
            <div className="w-full max-w-lg mt-6 flex flex-col gap-5">
                
                {/* Profile Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-emerald-900/10 p-5 flex items-center gap-4 transition hover:shadow-lg">
                    <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-[#004B29]/20 bg-gray-100 relative shrink-0 shadow-xs">
                        <Image
                            src={user.profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                            alt="avatar"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-base font-extrabold text-gray-900 leading-tight">{studentName}</h2>
                        <span className="text-[11px] text-[#004B29] font-bold mt-1 uppercase tracking-wider">{matricNumber}</span>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1.5">
                            <span>🎓 {departmentName}</span>
                            <span>•</span>
                            <span>{studentLevel} Level</span>
                        </p>
                    </div>
                </div>

                {/* Primary Scan QR Code Button */}
                <button
                    onClick={() => router.push('/student/scan')}
                    className="w-full bg-gradient-to-r from-[#004B29] to-[#006035] hover:opacity-95 text-white py-4 px-6 rounded-2xl shadow-xl shadow-[#004B29]/15 flex flex-col items-center justify-center gap-2 cursor-pointer transition transform active:scale-98 border border-white/10"
                >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-xs">
                        <ScanQrCode size={32} className="animate-pulse" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">Scan Classroom QR Code</span>
                    <span className="text-[10px] text-white/80 font-semibold">Verify class presence & mark attendance</span>
                </button>

                {/* Total Stats Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-emerald-900/10 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#ebf5ec] text-[#004B29] flex items-center justify-center border border-[#004B29]/20">
                            <Award size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Attendance Record</span>
                            <span className="text-[11px] text-gray-400 font-semibold mt-0.5">Classes Attended</span>
                        </div>
                    </div>
                    <span className="text-3xl font-black text-[#004B29]">{totalPresent}</span>
                </div>

                {/* Attendance History Section */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-emerald-900/10 p-5 flex flex-col">
                    <h3 className="text-xs font-bold text-gray-900 border-b pb-3 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-[#004B29]" /> Your Attendance Log History
                    </h3>

                    <div className="flex flex-col gap-3 max-h-[300px] overflow-auto pr-1">
                        {isHistoryLoading ? (
                            <div className="py-10 text-center text-gray-400 text-xs font-semibold">Loading history logs...</div>
                        ) : !attendanceData?.data || attendanceData.data.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-xs font-semibold">No check-ins recorded yet.</div>
                        ) : (
                            attendanceData.data.map((log: any) => (
                                <div 
                                    key={log.id} 
                                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-gray-800 leading-tight">
                                            {log.lecture_session?.course?.name}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-semibold mt-1">
                                            {log.lecture_session?.course?.code} • {log.lecture_session?.location}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                            log.status === 'PRESENT' 
                                                ? 'bg-[#ebf5ec] text-[#004B29] border border-[#004B29]/20' 
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {log.status}
                                        </span>
                                        <span className="text-[9px] text-gray-400 mt-1">
                                            {new Date(log.scanned_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
