"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  UserX, 
  ArrowLeft, 
  MinusCircle, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { absenceService, type AbsenceType } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function AbsenceTypeDetailsPage() {
  const t = useTranslations("absences");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [absence, setAbsence] = useState<AbsenceType | null>(null);
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
        const data = await absenceService.getById(id);
        setAbsence(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load absence type details");
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
        deduct_days: Number(formData.deduct_days),
      };

      await absenceService.update(id, payload);
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

  if (!absence) {
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
      defaultValue: absence.name
    },
    { 
      name: "deduct_days", 
      label: t('form.deductDays'), 
      type: "number", 
      required: true, 
      placeholder: t('form.daysPlaceholder'),
      defaultValue: absence.deduct_days
    },
    { 
      name: "requires_permission", 
      label: t('form.requiresPermission'), 
      type: "checkbox", 
      defaultValue: absence.requires_permission
    },
  ];

  const detailItems = [
    { label: t('form.name'), value: absence.name, icon: <UserX size={18} className="text-rose-500" /> },
    { label: t('form.deductDays'), value: `${absence.deduct_days} ${isAr ? 'أيام' : 'days'}`, icon: <MinusCircle size={18} className="text-orange-500" /> },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/absence_types`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{absence.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <UserX size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <UserX size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{absence.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {isAr ? "خصم" : "Deduct"} {absence.deduct_days} {isAr ? "أيام" : "Days"}
                    </span>
                    <span className="px-3 py-1 bg-rose-400/30 border border-rose-400/40 rounded-full text-[10px] font-bold text-rose-50">
                        {absence.requires_permission ? (isAr ? "يتطلب إذن" : "Requires Permission") : (isAr ? "بدون إذن" : "No Permission")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {detailItems.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 group transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-rose-50 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                <Info size={16} className="text-rose-500" />
                {t('absencePolicy')}
            </h3>
            
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${absence.requires_permission ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                <div className="flex items-center gap-4">
                  {absence.requires_permission ? <ShieldAlert size={24} className="text-amber-500" /> : <ShieldCheck size={24} className="text-emerald-500" />}
                  <div>
                    <div className="font-bold text-base">{t('form.requiresPermission')}</div>
                    <div className="text-xs opacity-70 mt-0.5">{t('form.permissionHint')}</div>
                  </div>
                </div>
                <div className="font-black text-xs px-4 py-1.5 bg-white rounded-full shadow-sm">
                    {absence.requires_permission ? t('requiresApprovalStatus') : t('directAbsenceStatus')}
                </div>
            </div>

            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <MinusCircle size={20} className="text-rose-500" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr 
                        ? "هذا النوع من الغياب يؤدي إلى خصم تلقائي من الراتب الشهري للموظف بناءً على عدد الأيام المحددة. يتم احتساب الخصم بناءً على الراتب الأساسي والبدلات المرتبطة بالحضور."
                        : "This type of absence leads to an automatic deduction from the employee's monthly salary based on the specified number of days. The deduction is calculated based on the basic salary and attendance-related allowances."
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
        title={t('editAbsence')}
      >
        <DynamicForm 
          key={absence.id + refreshTrigger}
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
