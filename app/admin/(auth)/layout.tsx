'use client';

import React, { useEffect } from 'react';
import { LayoutProps } from "@/types/ui";
import Image from "next/image";

const AuthLayout = ({ children }: LayoutProps) => {
  useEffect(() => {
    console.log('[MOUNT] AuthLayout');
  }, []);
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

      {/* Authentication Card (centered on small screens, right side on large screens) */}
      <div className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-2xl p-8 md:p-10 z-10 border border-gray-100 flex flex-col justify-center items-center">
        {children}
      </div>

      {/* Small watermark/logo at bottom left of the screen */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black text-white text-xs font-bold shadow-lg">
        N
      </div>
    </div>
  );
};

export default AuthLayout;