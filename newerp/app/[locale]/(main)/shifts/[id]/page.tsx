"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Clock, 
  ArrowLeft, 
  Calendar, 
  Settings, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Timer,
  CheckCircle2,
  XCircle
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { shiftService, type Shift } from "../service";
import { normalizeWorkDays } from "@/lib/utils/workDays";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function ShiftDetailsPage() {
  const t = useTranslations("shifts");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await shiftService.getById(id);
        setShift(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load shift details");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    fetchDetails();
  }, [id, isValidId, refreshTrigger]);

  const handleEditClick = () => {
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    setFormError(null);

    setFormSuccess(null);
    try {
      const payload = {
        ...formData,
        start_time: formData.start_time.slice(0, 5),
        end_time: formData.end_time.slice(0, 5),
        grace_minutes: Number(formData.grace_minutes),
        salary_basis_days: Number(formData.salary_basis_days),
      };

      await shiftService.update(id, payload);
      notify.success(t('messages.updateSuccess'));
      setFormSuccess(t('messages.updateSuccess'));

      setTimeout(() => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
      }, 1500);

    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setFormError(err?.message || t('messages.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (<RoleGuard permission="read:settings"><Loading className="min-h-[60vh]" /></RoleGuard>);

  if (!isValidId) {
    return (
      <RoleGuard permission="read:settings">
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">معرّف غير صالح</div>
      </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard permission="read:settings">
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">{error}</div>
      </div>
      </RoleGuard>
    );
  }

  if (!shift) {
    return (
      <RoleGuard permission="read:settings">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }


  
  const fields: FieldDef[] = [
    { 
      name: "name", 
      label: t('form.name'), 
      type: "text", 
      required: true, 
      placeholder: t('form.namePlaceholder'),
      defaultValue: shift.name
    },
    { 
      name: "type", 
      label: t('form.type'), 
      type: "select", 
      required: true, 
      options: [
        { label: isAr ? "صباحي" : "Morning", value: "morning" },
        { label: isAr ? "مسائي" : "Evening", value: "evening" },
        { label: isAr ? "ليلي" : "Night", value: "night" },
      ],
      defaultValue: shift.type
    },
    {
      name: "work_days",
      label: t('form.workDays'),
      type: "multi-select",
      required: true,
      options: [
        { label: isAr ? "الأحد" : "Sun", value: "sun" },
        { label: isAr ? "الاثنين" : "Mon", value: "mon" },
        { label: isAr ? "الثلاثاء" : "Tue", value: "tue" },
        { label: isAr ? "الأربعاء" : "Wed", value: "wed" },
        { label: isAr ? "الخميس" : "Thu", value: "thu" },
        { label: isAr ? "الجمعة" : "Fri", value: "fri" },
        { label: isAr ? "السبت" : "Sat", value: "sat" },
      ],
      defaultValue: normalizeWorkDays(shift.work_days)
    },
    { 
      name: "start_time", 
      label: t('form.startTime'), 
      type: "time", 
      required: true, 
      defaultValue: shift.start_time
    },
    { 
      name: "end_time", 
      label: t('form.endTime'), 
      type: "time", 
      required: true, 
      defaultValue: shift.end_time
    },
    { 
      name: "grace_minutes", 
      label: t('form.graceMinutes'), 
      type: "number", 
      defaultValue: shift.grace_minutes
    },
    { 
      name: "deduct_grace", 
      label: t('form.deductGrace'), 
      type: "checkbox", 
      defaultValue: shift.deduct_grace
    },
    { 
      name: "salary_basis_days", 
      label: t('form.salaryBasis'), 
      type: "number", 
      defaultValue: shift.salary_basis_days
    },
  ];

  const detailItems = [
    { label: t('form.name'), value: shift.name, icon: <Clock size={18} className="text-indigo-500" /> },
    { label: t('form.type'), value: shift.type, icon: <Settings size={18} className="text-purple-500" /> },
    { label: t('form.startTime'), value: shift.start_time, icon: <Timer size={18} className="text-emerald-500" /> },
    { label: t('form.endTime'), value: shift.end_time, icon: <Timer size={18} className="text-rose-500" /> },
    { label: t('form.graceMinutes'), value: `${shift.grace_minutes} ${isAr ? 'دقيقة' : 'min'}`, icon: <Activity size={18} className="text-amber-500" /> },
    { label: t('form.salaryBasis'), value: `${shift.salary_basis_days} ${isAr ? 'يوم' : 'days'}`, icon: <Calendar size={18} className="text-blue-500" /> },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/shifts`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{shift.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Clock size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{shift.name}</h1>
                <p className="text-indigo-100 mt-1 font-medium flex items-center gap-2">
                  <Timer size={14} />
                  {shift.start_time} - {shift.end_time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EditButton onClick={handleEditClick} className="bg-white/10 hover:bg-white/20 border-white/20 text-white" />
              <button 
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <ArrowLeft size={18} className={isAr ? "rotate-180" : ""} />
                {isAr ? "العودة للقائمة" : "Back to List"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {detailItems.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 group transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            {/* Work Days */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                {t('form.workDays')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {normalizeWorkDays(shift.work_days).map(day => (
                  <span key={day} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold capitalize">
                    {day}
                  </span>
                ))}
              </div>
            </div>

            {/* Deduction Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Settings size={16} className="text-purple-500" />
                {isAr ? "إعدادات الخصم" : "Deduction Settings"}
              </h3>
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${shift.deduct_grace ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                <div className="flex items-center gap-3">
                  {shift.deduct_grace ? <XCircle size={20} className="text-amber-500" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
                  <div>
                    <div className="font-bold text-sm">{t('form.deductGrace')}</div>
                    <div className="text-[11px] opacity-80">{t('form.deductGraceHint')}</div>
                  </div>
                </div>
                <div className="font-black text-xs uppercase">{shift.deduct_grace ? (isAr ? "مفعل" : "Enabled") : (isAr ? "معطل" : "Disabled")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editShift')}
      >
        <DynamicForm 
          key={shift.id + refreshTrigger}
          fields={fields}
          onSubmit={handleFormSubmit}
          error={formError}
          success={formSuccess}
        >
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <SaveButton 
              isSubmitting={isSubmitting} 
              label={t('buttons.update')} 
            />
          </div>
        </DynamicForm>
      </Modal>
    </div>
    </RoleGuard>
  );
}

