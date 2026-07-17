"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Gift, 
  ArrowLeft, 
  Wallet, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Banknote,
  Receipt,
  PencilLine,
  Lock
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { bonusService, type BonusType } from "../service";
import { formatCurrency } from "@/lib/utils/currency";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function BonusTypeDetailsPage() {
  const t = useTranslations("bonuses");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [bonus, setBonus] = useState<BonusType | null>(null);
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
        const data = await bonusService.getById(id);
        setBonus(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load bonus type details");
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
        default_amount: Number(formData.default_amount),
      };

      await bonusService.update(id, payload);
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

  if (!bonus) {
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
      defaultValue: bonus.name
    },
    { 
      name: "payment_type", 
      label: t('form.paymentType'), 
      type: "select", 
      required: true,
      options: [
        { label: isAr ? "نقدي" : "Cash", value: "cash" },
        { label: isAr ? "آجل" : "Deferred", value: "deferred" },
      ],
      defaultValue: bonus.payment_type
    },
    { 
      name: "default_amount", 
      label: t('form.defaultAmount'), 
      type: "number", 
      required: true, 
      placeholder: "0.00",
      defaultValue: bonus.default_amount
    },
    { 
      name: "editable_amount", 
      label: t('form.editableAmount'), 
      type: "checkbox", 
      defaultValue: bonus.editable_amount
    },
  ];

  const detailItems = [
    { label: t('form.name'), value: bonus.name, icon: <Gift size={18} className="text-purple-500" /> },
    { label: t('form.defaultAmount'), value: formatCurrency(bonus.default_amount, isAr), icon: <Wallet size={18} className="text-indigo-500" /> },
    { 
      label: t('form.paymentType'), 
      value: bonus.payment_type === 'cash' ? (isAr ? "نقدي" : "Cash") : (isAr ? "آجل" : "Deferred"), 
      icon: bonus.payment_type === 'cash' ? <Banknote size={18} className="text-emerald-500" /> : <Receipt size={18} className="text-orange-500" /> 
    },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/bonus_types`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{bonus.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Gift size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Gift size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{bonus.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {isAr ? "مكافأة" : "Bonus"}
                    </span>
                    <span className="px-3 py-1 bg-purple-400/30 border border-purple-400/40 rounded-full text-[10px] font-bold text-purple-50">
                        {bonus.payment_type}
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
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-purple-50 transition-colors">
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
                <Activity size={16} className="text-purple-500" />
                {isAr ? "سياسة المكافأة" : "Bonus Policy"}
            </h3>
            
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${bonus.editable_amount ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <div className="flex items-center gap-4">
                  {bonus.editable_amount ? <PencilLine size={24} className="text-blue-500" /> : <Lock size={24} className="text-slate-300" />}
                  <div>
                    <div className="font-bold text-base">{t('table.flexibility')}</div>
                    <div className="text-xs opacity-70 mt-0.5">{t('form.editableHint')}</div>
                  </div>
                </div>
                <div className="font-black text-xs px-4 py-1.5 bg-white rounded-full shadow-sm">
                    {bonus.editable_amount ? (isAr ? "قابل للتعديل" : "Editable") : (isAr ? "مبلغ ثابت" : "Fixed Amount")}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editBonusType')}
      >
        <DynamicForm 
          key={bonus.id + refreshTrigger}
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
