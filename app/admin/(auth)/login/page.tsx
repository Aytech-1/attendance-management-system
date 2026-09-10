'use client';

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useLogin } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

const Login = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { login: setAuth } = useAuth();
    const loginMutation = useLogin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!email.trim() || !password.trim()) {
            showToast("Please fill in both email and password.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await loginMutation.mutateAsync({
                email,
                password,
            });

            if (data.user.role === 'Student') {
                showToast("Student accounts must log in through the Student Portal.", "error");
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                return;
            }

            const authToken = data.token || data.access_token;
            setAuth(authToken, data.user);
            showToast("Logged in successfully. Welcome!");
            router.replace("/admin/dashboard");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Invalid credentials. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-start font-sans">
            {/* Overlapping circular logo badge */}
            <div className="absolute -top-6 left-6 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/all-images/image-pix/logo.png?v=2"
                    alt="NACOS Institution Logo"
                    className="w-10 h-10 object-contain"
                />
            </div>

            {/* Title with underline */}
            <div className="w-full flex flex-col items-start border-b-2 border-[#004B29] pb-2 mb-5">
                <h1 className="text-[20px] font-bold text-gray-900 leading-tight">
                    QR Code Smart Attendance System
                </h1>
                <h2 className="text-[18px] font-semibold text-gray-500 leading-none mt-1">
                    Admin Log-in
                </h2>
            </div>

            <form
                action="javascript:void(0)"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin(e);
                }}
                className="w-full flex flex-col gap-4"
            >
                {/* Green informational banner */}
                <div className="w-full bg-[#ebf5ec] border border-green-200 text-green-800 text-[11px] px-4 py-2.5 rounded-md font-bold leading-relaxed mb-1 text-left">
                    Kindly, provide your <span className="text-[#004B29] font-extrabold uppercase">EMAIL ADDRESS</span> to Login
                </div>

                {/* Email field */}
                <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="Enter Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#004B29] transition shadow-xs"
                />

                {/* Password field */}
                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#004B29] transition shadow-xs"
                />

                {/* Login button left-aligned */}
                <button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        handleLogin(e);
                    }}
                    disabled={isSubmitting}
                    className="w-fit min-w-[130px] h-10 px-5 flex justify-center items-center gap-1.5 bg-[#002613] hover:bg-[#003C1F] text-white text-xs font-bold rounded-md cursor-pointer transition shadow-md uppercase self-start"
                >
                    <span className="text-white text-xs">✔</span>
                    {isSubmitting ? "LOGGING IN..." : "LOG-IN"}
                </button>

                {/* Footer warning banner */}
                <div className="w-full bg-[#fdf3f0] border border-orange-100 text-gray-700 text-[11px] px-4 py-3.5 rounded-md font-semibold text-left mt-2">
                    Forget Password?{" "}
                    <span 
                        onClick={() => showToast("Password reset link has been simulated. Please contact IT.", "info")} 
                        className="text-[#004B29] cursor-pointer font-bold hover:underline"
                    >
                        RESET PASSWORD
                    </span>
                </div>
            </form>
        </div>
    );
};

export default Login;