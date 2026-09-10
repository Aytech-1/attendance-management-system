'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, GraduationCap, ArrowRight, Smartphone, BookOpen, MapPin } from 'lucide-react';

export default function LandingPage() {
    React.useEffect(() => {
        console.log('[TRACE] LandingPage mounted');
    }, []);

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans">
            {/* Background Campus Image */}
            <Image
                src="/all-images/bg-pix/loginbg.jpg"
                alt="University Campus"
                fill
                className="object-cover object-center pointer-events-none"
                priority
            />
            {/* Elegant dark-green glassmorphism overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-black/50 via-[#004B29]/65 to-black/85 z-0"></div>

            {/* Content Container */}
            <div className="relative w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 z-10 shadow-2xl flex flex-col items-center">
                
                {/* Institution Circular Logo */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-lg bg-white/95 flex items-center justify-center mb-6 animate__animated animate__zoomIn">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/all-images/image-pix/logo.png?v=2"
                        alt="NACOS Institution Logo"
                        className="w-20 h-20 object-contain"
                    />
                </div>

                {/* Typography Heading */}
                <h1 className="text-3xl md:text-5xl font-black text-white text-center tracking-tight leading-tight max-w-2xl">
                    Smart Attendance Management
                </h1>
                <p className="text-lg md:text-xl text-[#F5874F] font-bold text-center tracking-wide mt-2 uppercase">
                    Secure QR Code Portal
                </p>
                <p className="text-white/70 text-xs md:text-sm text-center max-w-lg mt-4 leading-relaxed font-medium">
                    A secure tertiary check-in portal incorporating dynamic time-sensitive QR code engines, 
                    GPS geofence radius validations, and live administrative audit trails.
                </p>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-10 max-w-3xl">
                    
                    {/* Feature 1 */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                            <Smartphone size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xs">Mobile Check-in</span>
                            <span className="text-white/50 text-[10px] font-semibold mt-0.5">Scan via camera</span>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                            <MapPin size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xs">Geofencing</span>
                            <span className="text-white/50 text-[10px] font-semibold mt-0.5">GPS location check</span>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                            <BookOpen size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xs">Live Monitoring</span>
                            <span className="text-white/50 text-[10px] font-semibold mt-0.5">Real-time stats</span>
                        </div>
                    </div>

                </div>

                {/* Primary Portal Access Buttons */}
                <div className="flex flex-col md:flex-row gap-4 w-full mt-10 max-w-3xl justify-center">
                    
                    {/* Admin Portal Button */}
                    <Link 
                        href="/admin/login" 
                        className="flex-1 min-h-20 bg-linear-to-r from-red-800 to-red-650 hover:from-red-750 hover:to-red-600 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                                <ShieldAlert size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm leading-tight">Administrative Portal</span>
                                <span className="text-white/60 text-[10px] font-semibold mt-1">Sign in as Admin / HOD / Staff</span>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-white/80" />
                    </Link>

                    {/* Student Portal Button */}
                    <Link 
                        href="/student/login" 
                        className="flex-1 min-h-20 bg-linear-to-r from-[#004B29] to-[#005c32] hover:from-[#00532d] hover:to-[#004726] border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                                <GraduationCap size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm leading-tight">Student Portal</span>
                                <span className="text-white/60 text-[10px] font-semibold mt-1">Sign in to scan attendance</span>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-white/80" />
                    </Link>

                </div>

                {/* Student Registration Link */}
                <div className="mt-8 text-center text-xs text-white/60 font-semibold">
                    New Student?{" "}
                    <Link 
                        href="/student/register" 
                        className="text-[#F5874F] hover:underline font-bold transition"
                    >
                        CREATE YOUR ATTENDANCE ACCOUNT HERE <ArrowRight size={12} className="inline ml-1" />
                    </Link>
                </div>

                {/* Portal Footer info */}
                <div className="mt-12 text-white/30 text-[10px] font-bold tracking-widest uppercase">
                    © 2026 QR Code Smart Attendance System
                </div>

            </div>
        </div>
    );
}
