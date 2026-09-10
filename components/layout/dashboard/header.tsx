'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { LogOut } from "lucide-react";
import { formatDisplayName } from "@/utils/format-name";
import LogoutModal from "@/components/ui/logout-modal";

const Header = () => {
    const { user } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const displayName = formatDisplayName(user?.name, user?.profile?.title || user?.title) || "Administrator";
    const displayRole = (user?.role || "SUPER ADMIN").toUpperCase();
    const photoPath = user?.profile?.photo_path || "/all-images/image-pix/avatar.jpg";

    return (
        <>
            <header className="w-full h-17.5 flex justify-center items-center bg-white fixed top-0 z-30 border-b border-gray-1">
                <div className="w-[95%] h-full max-w-3000 flex justify-between items-center">

                    <div className="w-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/all-images/image-pix/logo.png?v=2"
                                alt="NACOS Logo"
                                className="h-11 w-11 object-contain"
                            />
                            <span className="font-extrabold text-sm text-[#004B29] tracking-wider hidden sm:inline">NACOS ATTENDANCE</span>
                        </div>

                        <nav className="flex justify-center items-center gap-6 cursor-pointer">
                            <Link href="/admin/dashboard" className="text-[#004B29] font-bold text-xs">Dashboard</Link>
                            <Link href="/admin/dashboard/myprofile" className="text-gray-600 hover:text-[#004B29] font-semibold text-xs transition">My Profile</Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-right">
                                <span className="text-[13px] font-bold text-gray-900 leading-tight">
                                    {displayName}
                                </span>

                                <span className="text-[10px] text-[#004B29] font-extrabold tracking-wider">
                                    {displayRole}
                                </span>
                            </div>

                            <Link href="/admin/dashboard/myprofile">
                                <div className="w-10 h-10 overflow-hidden rounded-full border-2 border-[#004B29]/20 shadow-xs relative">
                                    <Image
                                        src={photoPath}
                                        alt="Profile Image"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </Link>
                        </div>

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            title="Logout of session"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>

                </div>
            </header>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                redirectPath="/admin/login"
            />
        </>
    );
};

export default Header;