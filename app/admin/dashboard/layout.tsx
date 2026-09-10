'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Header from "@/components/layout/dashboard/header";
import SideNav from "@/components/layout/dashboard/side-nav";
import Image from "next/image";
import { LayoutProps } from "@/types/ui";

const DashboardLayout = ({ children, formmodal, branchmodal }: LayoutProps) => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/admin/login');
      } else if (user.role === 'Student') {
        logout();
      }
    }
  }, [isLoading, isAuthenticated, user, router, logout]);

  if (isLoading || !isAuthenticated || !user || user.role === 'Student') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#f4f8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#004B29] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-gray-600">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Image
        src="/all-images/bg-pix/adminbg.jpg"
        alt="background" fill
        className="object-cover"
        priority
      />
      <Header />
      <SideNav />
      <main className="w-[calc(100%-120px)] h-[calc(100%-70px)] absolute right-0 bottom-0 overflow-auto bg-white/50 backdrop-blur-md">
        {children}
      </main>
      {formmodal}
      {branchmodal}
    </div>
  );
};

export default DashboardLayout;