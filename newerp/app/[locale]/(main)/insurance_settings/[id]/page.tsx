"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Calculator, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  UserCog,
  Building2,
  Percent,
  CalendarClock
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { insuranceService, type InsuranceSetting } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function InsuranceSettingDetailsPage() {
  const t = useTranslations("insurance");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [setting, setSetting] = useState<InsuranceSetting | null>(null);
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
        const data = await insuranceService.getById(id);
        setSetting(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load insurance details");
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
        employee_rate: Number(formData.employee_rate),
        company_rate: Number(formData.company_rate),
      };

      await insuranceService.update(id, payload);
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

  if (!setting) {
    return (
      <RoleGuard permission="read:settings">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }


  
  const effectiveDate = new Date(setting.effective_from).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const fields: FieldDef[] = [
    { 
      name: "employee_rate", 
      label: t('form.employeeRate'), 
      type: "number", 
      required: true, 
      placeholder: "11.00",
      defaultValue: setting.employee_rate
    },
    { 
      name: "company_rate", 
      label: t('form.companyRate'), 
      type: "number", 
      required: true, 
      placeholder: "18.75",
      defaultValue: setting.company_rate
    },
    { 
      name: "effective_from", 
      label: t('form.effectiveFrom'), 
      type: "date", 
      required: true, 
      defaultValue: setting.effective_from ? new Date(setting.effective_from).toISOString().split('T')[0] : ""
    },
  ];

  const detailItems = [
    { label: t('table.effectiveDate'), value: effectiveDate, icon: <CalendarClock size={18} className="text-indigo-500" /> },
    { label: t('table.employeeRate'), value: `${setting.employee_rate}%`, icon: <UserCog size={18} className="text-blue-500" /> },
    { label: t('table.companyRate'), value: `${setting.company_rate}%`, icon: <Building2 size={18} className="text-purple-500" /> },
    { label: t('table.totalRate'), value: `${(Number(setting.employee_rate) + Number(setting.company_rate)).toFixed(2)}%`, icon: <Calculator size={18} className="text-emerald-500" /> },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/insurance_settings`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">#{setting.id} - {effectiveDate}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{isAr ? "إعدادات التأمين" : "Insurance Setting"}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {isAr ? "بدءاً من" : "Effective from"} {effectiveDate}
                    </span>
                    <span className="px-3 py-1 bg-blue-400/30 border border-blue-400/40 rounded-full text-[10px] font-bold text-blue-50">
                        {isAr ? "تأمين اجتماعي" : "Social Insurance"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {detailItems.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 group transition-all text-center md:text-left rtl:md:text-right">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-black text-xl">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calculator size={16} className="text-indigo-500" />
                    {isAr ? "توزيع النسب" : "Ratio Distribution"}
                </h3>
                <div className="space-y-3">
                    <div className="relative h-10 w-full bg-slate-100 rounded-xl overflow-hidden flex font-bold text-[10px] uppercase text-white shadow-inner">
                        <div 
                            style={{ width: `${(setting.employee_rate / (Number(setting.employee_rate) + Number(setting.company_rate))) * 100}%` }}
                            className="bg-blue-500 flex items-center justify-center border-r border-white/20"
                        >
                            {isAr ? "الموظف" : "Employee"}
                        </div>
                        <div 
                            style={{ width: `${(setting.company_rate / (Number(setting.employee_rate) + Number(setting.company_rate))) * 100}%` }}
                            className="bg-indigo-600 flex items-center justify-center"
                        >
                            {isAr ? "الشركة" : "Company"}
                        </div>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
                        <span>{setting.employee_rate}%</span>
                        <span>{setting.company_rate}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" />
                    {isAr ? "قواعد الاحتساب" : "Calculation Rules"}
                </h3>
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
                        <Percent size={20} />
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                        {isAr 
                            ? `يتم احتساب مبلغ التأمين بناءً على الراتب الخاضع للتأمين. يساهم الموظف بنسبة ${setting.employee_rate}%، بينما تساهم المنشأة بنسبة ${setting.company_rate}%.`
                            : `The insurance amount is calculated based on the insurable salary. The employee contributes ${setting.employee_rate}%, while the company contributes ${setting.company_rate}%.`
                        }
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editSetting')}
      >
        <DynamicForm 
          key={setting.id + refreshTrigger}
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
