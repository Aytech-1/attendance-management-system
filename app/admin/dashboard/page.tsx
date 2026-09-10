'use client';

import React from 'react';
import styles from "@/styles/component/dashboard.module.css";
import { useDashboardStats } from "@/components/api/client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, Building2, ClipboardCheck, Clock } from "lucide-react";

const Dashboard = () => {
  const { user: profile } = useAuth();
  const { data: statsData, isLoading } = useDashboardStats();

  const adminName = profile?.name || 'Administrator';
  const role = profile?.role || '';

  // Format current date
  const lastLogin = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Filter cards based on user role
  const allCards = [
    {
      title: "Total Staff",
      subtitle: "Department Faculty",
      value: statsData?.counters?.total_staff || 0,
      icon: Users,
      link: "/admin/dashboard/staff",
      roles: ['Super Admin', 'Admin', 'Super Administrator', 'Administrator', 'Head of Department']
    },
    {
      title: "Total Departments",
      subtitle: "Academic Faculty",
      value: statsData?.counters?.total_departments || 0,
      icon: Building2,
      link: "/admin/dashboard/department",
      roles: ['Super Admin', 'Admin', 'Super Administrator', 'Administrator']
    },
    {
      title: "Total Courses",
      subtitle: "Active Curriculum",
      value: statsData?.counters?.total_courses || 0,
      icon: BookOpen,
      link: "/admin/dashboard/course",
      roles: ['Super Admin', 'Admin', 'Super Administrator', 'Administrator', 'Head of Department', 'Lecturer']
    },
    {
      title: "Total Students",
      subtitle: "Enrolled Learners",
      value: statsData?.counters?.total_students || 0,
      icon: ClipboardCheck,
      link: "/admin/dashboard/students",
      roles: ['Super Admin', 'Admin', 'Super Administrator', 'Administrator', 'Head of Department', 'Lecturer']
    }
  ];

  // Memoized cards list based on profile role
  const cards = React.useMemo(() => {
    return allCards.filter(c => !role || c.roles.includes(role));
  }, [allCards, role]);

  // Memoized SVG Line Chart rendering calculations
  const trends = React.useMemo(() => statsData?.trends || [], [statsData?.trends]);
  const maxTrendValue = React.useMemo(() => {
    return Math.max(...trends.map((t: any) => Number(t.value) || 0), 10);
  }, [trends]);

  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;

  // Memoized Donut chart calculation helper
  const shares = React.useMemo(() => statsData?.shares || [], [statsData?.shares]);
  let accumulatedPercent = 0;

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <LayoutDashboard />
          </div>
          <div className={styles.headerText}>
            <h2>👋 Welcome Back, {adminName}!</h2>
            <p>
              {role === 'Head of Department'
                ? "Oversee department courses, track lecturer sessions, monitor student attendance, and analyze department analytics."
                : role === 'Lecturer'
                ? "Manage your assigned courses, project live QR session tokens, track classroom attendance, and verify student logs."
                : "Manage security logs, track session activity, monitor geofencing check-ins, and control your institution's Smart Attendance Portal."}
            </p>
          </div>
        </div>

        <div className="text-[12px] flex items-center gap-2.5 rounded-lg bg-(--white-color) py-3 px-4 border border-gray-100 shadow-xs">
          <span className="text-gray-500 font-medium">Current Session:</span>
          <strong className="text-gray-800 font-bold">{lastLogin}</strong>
        </div>
      </div>

      {/* Cards Row */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${cards.length === 2 ? 'lg:grid-cols-2' : cards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 px-5`}>
        {cards.map((item, index) => (
          <Link
            href={item.link}
            key={index}
            className={styles.statisticsCard}
          >
            <div className={styles.statisticsInner}>
              <div className={styles.statisticsText}>
                <h3>{item.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.subtitle}</p>
                <span className={styles.statisticsValue}>
                  {isLoading ? '...' : item.value}
                </span>
              </div>
              <div className={`${styles.statisticsIcon} bg-[#004B29]/10 text-[#004B29]`}>
                <item.icon size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-5 items-stretch">
        
        {/* Left Card: Attendance Trends SVG Chart */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-xs p-5 flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-1.5">
            📈 Attendance Trends (Weekly overview)
          </h3>
          <div className="w-full flex items-center justify-center grow min-h-[220px]">
            {isLoading ? (
              <div className="text-gray-400 text-xs">Loading trends chart...</div>
            ) : trends.length === 0 ? (
              <div className="text-gray-400 text-xs">No attendance trend data available yet.</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-h-[220px]">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + (chartHeight - 2 * padding) * (1 - ratio);
                  return (
                    <g key={i}>
                      <line 
                        x1={padding} 
                        y1={y} 
                        x2={chartWidth - padding} 
                        y2={y} 
                        stroke="#f1f5f9" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={padding - 10} 
                        y={y + 4} 
                        fontSize="9" 
                        fill="#94a3b8" 
                        textAnchor="end"
                        className="font-semibold"
                      >
                        {Math.round(maxTrendValue * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* Line path connection */}
                {trends.length > 0 && (
                  <path
                    d={trends.map((t: any, i: number) => {
                      const divisor = trends.length > 1 ? trends.length - 1 : 1;
                      const x = padding + (i * (chartWidth - 2 * padding)) / divisor;
                      const val = Number(t.value) || 0;
                      const y = padding + (chartHeight - 2 * padding) * (1 - val / maxTrendValue);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#004B29"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Markers & Labels */}
                {trends.map((t: any, i: number) => {
                  const divisor = trends.length > 1 ? trends.length - 1 : 1;
                  const x = padding + (i * (chartWidth - 2 * padding)) / divisor;
                  const val = Number(t.value) || 0;
                  const y = padding + (chartHeight - 2 * padding) * (1 - val / maxTrendValue);
                  return (
                    <g key={i}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="5.5" 
                        fill="#004B29" 
                        stroke="#fff" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={x} 
                        y={chartHeight - padding + 18} 
                        fontSize="10" 
                        fill="#64748b" 
                        textAnchor="middle"
                        className="font-bold"
                      >
                        {t.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right Card: Enrollment Distribution Donut SVG Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-1.5">
              📊 Enrollment Distribution
            </h3>
            <div className="flex justify-center items-center py-4">
              {isLoading ? (
                <div className="text-gray-400 text-xs">Loading distribution chart...</div>
              ) : shares.length === 0 ? (
                <div className="text-gray-400 text-xs">No distribution data.</div>
              ) : (
                <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                  {shares.map((share: any, idx: number) => {
                    const strokeDasharray = `${share.percentage} ${100 - share.percentage}`;
                    const strokeDashoffset = 100 - accumulatedPercent + 25;
                    accumulatedPercent += Number(share.percentage) || 0;
                    const colors = ["#004B29", "#F5874F", "#9d043c", "#64748b"];
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-col gap-2.5 mt-2">
            {shares.map((share: any, idx: number) => {
              const colors = ["bg-[#004B29]", "bg-[#F5874F]", "bg-[#9d043c]", "bg-[#64748b]"];
              return (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                    <span>{share.name}</span>
                  </div>
                  <span>{share.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Logs / Recent Audits */}
      <div className="px-5 pb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={16} className="text-gray-500" /> Recent Portal Activities
          </h3>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="p-5 text-center text-gray-400 text-xs">Loading activity logs...</div>
            ) : !statsData?.activities || statsData.activities.length === 0 ? (
              <div className="p-5 text-center text-gray-400 text-xs">No recent actions captured.</div>
            ) : (
              statsData.activities.map((log: any) => (
                <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-gray-800">
                      {log.action} - <span className="text-gray-500 font-semibold">{log.user}</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-3">
                    {log.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;