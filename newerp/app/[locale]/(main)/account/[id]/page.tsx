"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Landmark, 
  ArrowLeft, 
  Hash, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Coins,
  BookOpen,
  TreeDeciduous,
  FileText
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { accountService, type Account } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function AccountDetailsPage() {
  const t = useTranslations("accounts");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await accountService.getById(id);
        setAccount(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load account details");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAllAccounts = async () => {
      try {
        const res = await accountService.getAll();
        setAllAccounts(res.data || []);
      } catch (e) { notify.handleApiError(e as { message?: string }); }
    };

    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    {
      fetchDetails();
      fetchAllAccounts();
    }
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
        parent_id: formData.parent_id ? Number(formData.parent_id) : null,
      };

      await accountService.update(id, payload);
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

  if (!account) {
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
      defaultValue: account.name
    },
    { 
      name: "code", 
      label: t('form.code'), 
      type: "text", 
      required: true, 
      defaultValue: account.code
    },
    { 
      name: "type", 
      label: t('form.type'), 
      type: "select", 
      required: true,
      options: [
        { label: isAr ? "مصروفات" : "Expense", value: "expense" },
        { label: isAr ? "إيرادات" : "Revenue", value: "revenue" },
        { label: isAr ? "أصول" : "Asset", value: "asset" },
        { label: isAr ? "خصوم" : "Liability", value: "liability" },
        { label: isAr ? "حقوق ملكية" : "Equity", value: "equity" },
      ],
      defaultValue: account.type
    },
    { 
      name: "parent_id", 
      label: t('form.parentAccount'), 
      type: "select", 
      placeholder: t('form.noParent'),
      options: allAccounts
        .filter(acc => acc.id !== account.id)
        .map(acc => ({ label: `${acc.code} - ${acc.name}`, value: acc.id })),
      defaultValue: account.parent_id || ""
    },
    { 
      name: "currency", 
      label: t('form.currency'), 
      type: "select",
      options: [
        { label: "EGP", value: "EGP" },
        { label: "USD", value: "USD" },
        { label: "SAR", value: "SAR" },
        { label: "EUR", value: "EUR" },
      ],
      defaultValue: account.currency
    },
    { 
      name: "description", 
      label: t('form.description'), 
      type: "textarea",
      defaultValue: account.description
    },
  ];

  const detailItems = [
    { label: t('table.code'), value: account.code, icon: <Hash size={18} className="text-slate-500" /> },
    { label: t('table.name'), value: account.name, icon: <BookOpen size={18} className="text-indigo-500" /> },
    { label: t('table.type'), value: account.type, icon: <Activity size={18} className="text-purple-500" /> },
    { label: t('table.currency'), value: account.currency, icon: <Coins size={18} className="text-amber-500" /> },
    { label: t('table.parent'), value: account.parent_id ? (allAccounts.find(a => a.id === account.parent_id)?.name || account.parent_id) : (isAr ? "حساب رئيسي" : "Main Account"), icon: <TreeDeciduous size={18} className="text-emerald-500" /> },
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/account`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{account.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Landmark size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Landmark size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{account.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {account.code}
                    </span>
                    <span className="px-3 py-1 bg-emerald-400/30 border border-emerald-400/40 rounded-full text-[10px] font-bold text-emerald-50 uppercase">
                        {account.type}
                    </span>
                    <span className="px-3 py-1 bg-amber-400/30 border border-amber-400/40 rounded-full text-[10px] font-bold text-amber-50 uppercase">
                        {account.currency}
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
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-slate-100 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>

          {account.description && (
            <div className="space-y-4 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-slate-500" />
                    {t('form.description')}
                </h3>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 leading-relaxed italic">
                    "{account.description}"
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editAccount')}
      >
        <DynamicForm 
          key={account.id + refreshTrigger}
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
