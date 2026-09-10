'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateQrToken, useLiveAttendance, useSessionDetails } from "@/components/api/client";
import { GraduationCap, ArrowLeft, RefreshCw, Users, CheckCircle, Download, Printer } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast-provider';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
    const router = useRouter();
    const { showToast } = useToast();
    
    // Resolve dynamic params in Next.js 15+
    const resolvedParams = use(params);
    const sessionId = Number(resolvedParams.id);

    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // Fetch session details directly by ID
    const { data: session } = useSessionDetails(sessionId);

    // Fetch live student check-ins
    const { data: checkedInStudents, refetch: refetchStudents } = useLiveAttendance(sessionId);

    // Token generation mutation
    const qrMutation = useGenerateQrToken();

    const fetchSessionToken = async () => {
        try {
            const data = await qrMutation.mutateAsync(sessionId);
            setQrCodeUrl(data.qr_code_url);
        } catch (err: any) {
            showToast("Failed to fetch classroom QR Code.", "error");
        }
    };

    // Initial load of QR Code
    useEffect(() => {
        if (sessionId) {
            fetchSessionToken();
        }
    }, [sessionId]);

    // Poll live student check-ins
    useEffect(() => {
        const checkInPoll = setInterval(() => {
            refetchStudents();
        }, 5000);

        return () => clearInterval(checkInPoll);
    }, [sessionId]);

    const handleDownloadQr = () => {
        if (!qrCodeUrl) {
            showToast("QR Code is not ready yet.", "error");
            return;
        }
        const link = document.createElement("a");
        link.href = qrCodeUrl;
        link.download = `Attendance-QR-${session?.course?.code || 'Session'}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("QR Code downloaded successfully.");
    };

    const handlePrintPdf = () => {
        if (!qrCodeUrl) {
            showToast("QR Code is not ready yet.", "error");
            return;
        }
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            showToast("Please allow popups to print/export PDF.", "error");
            return;
        }
        const courseName = session?.course?.name || "Class Attendance Session";
        const courseCode = session?.course?.code || "N/A";
        const location = session?.location || "N/A";
        const dateStr = session?.date ? new Date(session.date).toLocaleDateString() : "N/A";

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Attendance QR - ${courseCode}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 40px;
                            text-align: center;
                        }
                        .header {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            margin-bottom: 20px;
                        }
                        .header img {
                            width: 60px;
                            height: 60px;
                        }
                        .header h1 {
                            font-size: 22px;
                            color: #004B29;
                            margin: 0;
                        }
                        .details {
                            margin-bottom: 30px;
                            font-size: 14px;
                            color: #4b5563;
                        }
                        .qr-box {
                            border: 4px solid #004B29;
                            padding: 20px;
                            border-radius: 20px;
                            display: inline-block;
                            margin-bottom: 20px;
                        }
                        .qr-box img {
                            width: 320px;
                            height: 320px;
                        }
                        .footer {
                            font-size: 12px;
                            color: #6b7280;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/all-images/image-pix/logo.png?v=2" alt="Logo" />
                        <div>
                            <h1>${courseCode} - ${courseName}</h1>
                            <div style="font-size: 12px; color: #004B29; font-weight: bold; margin-top: 4px;">SMART QR ATTENDANCE SESSION</div>
                        </div>
                    </div>
                    <div class="details">
                        📍 Location: <strong>${location}</strong> &nbsp;•&nbsp; 📅 Date: <strong>${dateStr}</strong>
                    </div>
                    <div class="qr-box">
                        <img src="${qrCodeUrl}" alt="QR Code" />
                    </div>
                    <div class="footer">
                        Point your mobile camera scanner at this QR code to mark your attendance.<br/>
                        Generated by NACOS Smart Attendance System
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="w-full h-full min-h-[calc(100vh-70px)] bg-[#fdfdfd] flex flex-col p-6 font-sans">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-6 gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition cursor-pointer self-start sm:self-auto"
                >
                    <ArrowLeft size={14} /> BACK TO SESSIONS
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadQr}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ebf5ec] text-[#004B29] hover:bg-[#d8ebd9] border border-[#004B29]/20 text-xs font-bold rounded-lg transition cursor-pointer"
                        title="Download QR SVG"
                    >
                        <Download size={14} /> DOWNLOAD QR
                    </button>
                    
                    <button
                        onClick={handlePrintPdf}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#004B29] hover:bg-[#003B1D] text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                        title="Print / Save PDF"
                    >
                        <Printer size={14} /> PRINT / SAVE PDF
                    </button>

                    <div className="hidden sm:flex items-center gap-2 border-l pl-3 ml-1">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                        </span>
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">PROJECTOR MODE</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 w-full grow items-stretch">
                {/* Left Side: QR Code Generator Card */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-center items-center relative min-h-[500px]">
                    
                    {/* Header info */}
                    <div className="text-center mb-5 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-[#004B29]/10 text-[#004B29] flex items-center justify-center mb-3">
                            <GraduationCap size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-none">
                            {session?.course?.name || 'Class Attendance Session'}
                        </h2>
                        <span className="text-sm font-semibold text-[#004B29] bg-[#004B29]/10 px-3 py-1 rounded-full mt-2">
                            {session?.course?.code || 'N/A'}
                        </span>
                        <p className="text-sm text-gray-500 mt-2 font-medium flex items-center gap-1.5 justify-center">
                            <span>📍 Location: <strong>{session?.location || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>📅 Date: <strong>{session?.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</strong></span>
                        </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative border-4 border-[#004B29] p-4 rounded-2xl bg-white shadow-md flex items-center justify-center w-80 h-80 transition hover:scale-102">
                        {qrCodeUrl ? (
                            <Image 
                                src={qrCodeUrl} 
                                alt="attendance qr code" 
                                width={280} 
                                height={280} 
                                className="object-contain"
                                priority
                            />
                        ) : (
                            <div className="text-gray-400 text-xs flex flex-col items-center gap-2">
                                <RefreshCw className="animate-spin text-[#004B29]" size={24} />
                                Generating Secure Token...
                            </div>
                        )}

                        {/* Session Status Overlay Badge */}
                        <div className="absolute -bottom-4 bg-[#004B29] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow flex items-center gap-1">
                            <CheckCircle size={12} className="animate-pulse" />
                            ACTIVE SESSION QR
                        </div>
                    </div>

                    <div className="mt-8 text-center max-w-sm text-xs text-gray-500 font-medium leading-relaxed">
                        Scan this QR code using the camera scanner in your mobile student portal to verify presence and mark attendance.
                    </div>
                </div>

                {/* Right Side: Checked-In Students Panel */}
                <div className="w-full xl:w-96 bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-[#004B29]" />
                            <h3 className="font-bold text-gray-900 text-sm">Checked-In Students</h3>
                        </div>
                        <span className="bg-[#004B29] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {checkedInStudents?.length || 0}
                        </span>
                    </div>

                    <div className="grow overflow-auto max-h-[420px] xl:max-h-[unset] flex flex-col gap-2.5 pr-1">
                        {!checkedInStudents || checkedInStudents.length === 0 ? (
                            <div className="grow flex flex-col items-center justify-center text-gray-400 text-xs py-20 gap-2 font-medium">
                                <CheckCircle size={28} className="text-gray-300 animate-pulse" />
                                Waiting for students to check in...
                            </div>
                        ) : (
                            checkedInStudents.map((attendance: any) => (
                                <div 
                                    key={attendance.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition animate__animated animate__fadeInUp"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 relative">
                                            <Image
                                                src={attendance.student?.student_profile?.photo_path || "/all-images/image-pix/avatar.jpg"}
                                                alt="avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-gray-800 leading-tight">
                                                {attendance.student?.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                {attendance.student?.student_profile?.matric_number || 'STUDENT'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                                            {attendance.status}
                                        </span>
                                        <span className="text-[9px] text-gray-400 mt-1">
                                            {new Date(attendance.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
