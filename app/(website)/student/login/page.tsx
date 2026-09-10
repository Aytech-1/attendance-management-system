'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from "@/components/ui/toast-provider";
import { useLogin } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";

export default function StudentLoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { login: setAuth } = useAuth();
    const loginMutation = useLogin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required.";
        } else if (password.trim().length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast("Please correct validation errors below.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const data = await loginMutation.mutateAsync({
                email: email.trim(),
                password: password.trim(),
            });

            const roleName = data?.user?.role ? String(data.user.role).toLowerCase() : '';
            if (roleName !== 'student') {
                showToast("This portal is only for students.", "error");
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                return;
            }

            const authToken = data.token || data.access_token;
            setAuth(authToken, data.user);
            showToast("Logged in successfully. Welcome to Student Portal!");
            router.replace("/student/dashboard");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative w-full h-screen flex justify-end items-center px-10 xl:px-40 overflow-hidden font-sans">
            {/* Background Image */}
            <Image
                src="/all-images/bg-pix/qr_login_bg.jpg"
                alt="Institutional Campus Background"
                fill
                className="object-cover object-center"
                priority
            />
            {/* Dark overlay to give contrast */}
            <div className="absolute inset-0 bg-black/20 z-0"></div>

            {/* Authentication Card */}
            <div className="relative w-full max-w-125 bg-white rounded-2xl shadow-2xl p-8 md:p-10 z-10 border border-gray-100 flex flex-col justify-center items-center">
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
                    <h1 className="text-[18px] font-semibold text-gray-500 leading-tight">
                          Student Log-in
                    </h1>
                </div>

                <form
                    onSubmit={handleLogin}
                    className="w-full flex flex-col gap-4"
                >
                    {/* Green informational banner */}
                    <div className="w-full bg-[#ebf5ec] border border-green-200 text-green-800 text-[11px] px-4 py-2.5 rounded-md font-bold leading-relaxed mb-1 text-left">
                        Kindly, provide your <span className="text-[#004B29] font-extrabold uppercase">EMAIL ADDRESS</span> to Login
                    </div>

                    {/* Email field */}
                    <div className="w-full flex flex-col items-start gap-1">
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            placeholder="Enter Your Email Address"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                            }}
                            className={`w-full bg-white border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#004B29] transition shadow-xs`}
                        />
                        {errors.email && (
                            <span className="text-[11px] text-red-500 font-semibold">{errors.email}</span>
                        )}
                    </div>

                    {/* Password field */}
                    <div className="w-full flex flex-col items-start gap-1">
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            placeholder="Enter Your Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                            }}
                            className={`w-full bg-white border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#004B29] transition shadow-xs`}
                        />
                        {errors.password && (
                            <span className="text-[11px] text-red-500 font-semibold">{errors.password}</span>
                        )}
                    </div>

                    {/* Login button left-aligned */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-fit min-w-[130px] h-10 px-5 flex justify-center items-center gap-1.5 bg-[#002613] hover:bg-[#003C1F] text-white text-xs font-bold rounded-md cursor-pointer transition shadow-md uppercase self-start disabled:opacity-50"
                    >
                        <span className="text-white text-xs">✔</span>
                        {isSubmitting ? "AUTHENTICATING..." : "STUDENT LOGIN"}
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

            {/* Small watermark/logo at bottom left of the screen */}
            <div className="absolute bottom-5 left-5 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black text-white text-xs font-bold shadow-lg">
                N
            </div>
        </div>
    );
}
