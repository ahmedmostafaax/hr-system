"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Calendar, 
  ArrowLeft, 
  Settings, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Calculator,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { leaveTypeService, type LeaveType } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function LeaveTypeDetailsPage() {
  const t = useTranslations("leaveTypes");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [leave, setLeave] = useState<LeaveType | null>(null);
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
        const data = await leaveTypeService.getById(id);
        setLeave(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load leave type details");
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
        annual_balance: Number(formData.annual_balance),
        affects_deduction: Boolean(formData.affects_deduction),
      };

      await leaveTypeService.update(id, payload);
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

  if (!leave) {
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
      defaultValue: leave.name
    },
    { 
      name: "annual_balance", 
      label: t('form.annualBalance'), 
      type: "number", 
      required: true, 
      placeholder: t('form.balancePlaceholder'),
      defaultValue: leave.annual_balance || leave.default_days || 0
    },
    { 
      name: "affects_deduction", 
      label: t('form.affectsDeduction'), 
      type: "checkbox", 
      hint: t('form.deductionHint'),
      defaultValue: leave.affects_deduction ?? !leave.is_paid
    },
  ];

  const detailItems = [
    { 
      label: t('table.name'), 
      value: leave.name, 
      icon: <FileText size={18} className="text-indigo-500" /> 
    },
    { 
      label: t('table.annualBalance'), 
      value: `${leave.annual_balance || leave.default_days || 0} ${isAr ? 'يوم' : 'days'}`, 
      icon: <Calculator size={18} className="text-purple-500" /> 
    },
    { 
      label: t('table.affectsDeduction'), 
      value: (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${
            leave.affects_deduction 
            ? 'bg-rose-50 text-rose-600 border-rose-100' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {leave.affects_deduction ? <XCircle size={12}/> : <CheckCircle2 size={12}/>}
          {leave.affects_deduction ? (isAr ? "تخصم من الراتب" : "Affects Salary") : (isAr ? "إجازة مدفوعة" : "Paid Leave")}
        </div>
      ), 
      icon: <Settings size={18} className="text-slate-400" /> 
    },
  ];


  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/leaveTypes`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{leave.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Calendar size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Calendar size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{leave.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {leave.default_days || leave.annual_balance} {isAr ? 'يوم سنوي' : 'Days/Year'}
                    </span>
                    {(leave.is_paid || !leave.affects_deduction) && (
                        <span className="px-3 py-1 bg-emerald-400/30 border border-emerald-400/40 rounded-full text-[10px] font-bold text-emerald-50">
                            {isAr ? 'مدفوعة' : 'Paid'}
                        </span>
                    )}
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
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editLeaveType')}
      >
        <DynamicForm 
          key={leave.id + refreshTrigger}
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

