import React from "react";

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  iconBgColor?: string;
  iconTextColor?: string;
}

export default function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  iconBgColor = "bg-gray-100",
  iconTextColor = "text-slate-600"
}: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-white/10 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor} ${iconTextColor}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-slate-500 text-[14px] font-medium leading-tight mb-1">{title}</span>
        <span className="text-2xl font-extrabold text-indigo-950 leading-none">{value}</span>
        {subtitle && (
          <span className="text-slate-400 text-[12px] mt-1.5 font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
