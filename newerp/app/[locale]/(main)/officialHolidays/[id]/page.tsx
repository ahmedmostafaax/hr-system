"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Palmtree, 
  ArrowLeft, 
  Calendar, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Clock,
  Globe
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { holidayService, type OfficialHoliday } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function HolidayDetailsPage() {
  const t = useTranslations("holidays");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [holiday, setHoliday] = useState<OfficialHoliday | null>(null);
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
        const data = await holidayService.getById(id);
        setHoliday(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load holiday details");
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
        name: formData.name,
        start_date: formData.start_date,
        days_count: Number(formData.days_count),
      };

      await holidayService.update(id, payload);
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

  if (!holiday) {
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
      defaultValue: holiday.name
    },
    { 
      name: "start_date", 
      label: t('form.startDate'), 
      type: "date", 
      required: true, 
      defaultValue: holiday.start_date
    },
    { 
      name: "days_count", 
      label: t('form.daysCount'), 
      type: "number", 
      required: true, 
      placeholder: t('form.daysCountPlaceholder'),
      defaultValue: holiday.days_count
    },
  ];

  const detailItems = [
    { label: t('form.name'), value: holiday.name, icon: <Palmtree size={18} className="text-emerald-500" /> },
    { label: t('form.startDate'), value: new Date(holiday.start_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'), icon: <Calendar size={18} className="text-indigo-500" /> },
    { label: t('form.daysCount'), value: `${holiday.days_count} ${isAr ? 'أيام' : 'days'}`, icon: <Clock size={18} className="text-amber-500" /> },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/officialHolidays`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{holiday.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Palmtree size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Palmtree size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{holiday.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {holiday.days_count} {isAr ? 'أيام إجازة' : 'Days Off'}
                    </span>
                    <span className="px-3 py-1 bg-orange-400/30 border border-orange-400/40 rounded-full text-[10px] font-bold text-orange-50">
                        {isAr ? 'إجازة رسمية' : 'Official Holiday'}
                    </span>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailItems.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 group transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-orange-50 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <Globe size={24} />
            </div>
            <div>
                <h4 className="font-bold text-indigo-900 mb-1">{isAr ? "نطاق الإجازة" : "Holiday Scope"}</h4>
                <p className="text-sm text-indigo-700 leading-relaxed">
                    {isAr 
                        ? "هذه الإجازة تطبق على جميع موظفي الشركة في جميع الفروع. يتم احتساب هذه الأيام كإجازة مدفوعة الأجر ولا تخصم من رصيد الإجازات السنوية للموظف."
                        : "This holiday applies to all company employees across all branches. These days are considered paid leave and are not deducted from the employee's annual leave balance."
                    }
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editHoliday')}
      >
        <DynamicForm 
          key={holiday.id + refreshTrigger}
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

