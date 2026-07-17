"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Users, 
  ArrowLeft, 
  User, 
  Heart, 
  ShieldAlert,
  ChevronRight,
  Calendar,
  Briefcase,
  Phone,
  Hash,
  Clock,
  ExternalLink
} from "lucide-react";
import { relativeService, type EmployeeRelative } from "../service";
import Loading from "@/components/ui/Loading";
import dynamic from "next/dynamic";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function EmployeeRelativeDetailsPage() {
  const t = useTranslations("relatives");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [relative, setRelative] = useState<EmployeeRelative | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const data = await relativeService.getById(id);
      setRelative(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError(err?.message || "Failed to load relative details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    fetchDetails();
  }, [id, isValidId]);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await relativeService.update(id, formData);
      notify.success(t('messages.updateSuccess'));
      setFormSuccess(t('messages.updateSuccess'));
      setTimeout(() => {
        setIsModalOpen(false);
        fetchDetails();
      }, 1500);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setFormError(err?.message || t('messages.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (<RoleGuard permission="read:employees"><Loading className="min-h-[60vh]" /></RoleGuard>);

  if (!isValidId) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">معرّف غير صالح</div>
      </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">{error}</div>
      </div>
      </RoleGuard>
    );
  }

  if (!relative) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }


  
  // مصفوفة البيانات الأساسية
  const detailItems = [
    { label: t('table.name'), value: relative.name, icon: <User size={18} className="text-indigo-500" /> },
    { label: t('table.relation'), value: t(`relations.${relative.relation}`), icon: <Heart size={18} className="text-rose-500" /> },
    { label: t('table.phone'), value: relative.phone, icon: <Phone size={18} className="text-emerald-500" />, isPhone: true },
  ];

  // مصفوفة بيانات النظام
  const systemItems = [
    { label: t('createdAt'), value: relative.createdAt ? new Date(relative.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US') : "—", icon: <Calendar size={14} /> },
    { label: t('updatedAt'), value: relative.updatedAt ? new Date(relative.updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US') : "—", icon: <Clock size={14} /> },
  ];

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <button onClick={() => router.push('/employeeRelative')} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="text-slate-800">{relative.name}</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <Users size={240} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <User size={40} className="text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black tracking-tight">{relative.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${relative.is_deleted ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-blue-500/20 border-blue-500/40 text-blue-200'}`}>
                        {t(`relations.${relative.relation}`)}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                        <Hash size={14} /> ID: {relative.id}
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                        <Phone size={14} /> {relative.phone}
                    </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EditButton 
                onClick={() => setIsModalOpen(true)} 
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white" 
              />
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs transition-all hover:bg-slate-100 flex items-center gap-2 shadow-xl"
              >
                <ArrowLeft size={16} className={isAr ? "rotate-180" : ""} />
                {t('backToList')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Primary Details */}
            <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailItems.map((item, idx) => (
                        <div key={idx} className="p-6 rounded-3xl border border-slate-100 bg-slate-50 group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                            </div>
                            {item.isPhone ? (
                                <a href={`tel:${item.value}`} className="text-blue-600 font-bold text-lg hover:underline flex items-center gap-2">
                                    {item.value}
                                    <ExternalLink size={14} />
                                </a>
                            ) : (
                                <div className="text-slate-800 font-bold text-lg">{item.value}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* System Logs Area */}
                <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={14} /> {t('systemLogs')}
                    </h4>
                    <div className="space-y-3">
                        {systemItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">{item.label}</span>
                                <span className="text-slate-700 font-bold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar: Linked Employee Card */}
            <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Briefcase size={120} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">
                            <Users size={14} />
                            {t('associatedEmployee')}
                        </div>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 mb-1">
                                {relative.Employee?.full_name || `ID: ${relative.employee_id}`}
                            </h3>
                            <p className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                                <Hash size={14} /> {t('code')}: {relative.Employee?.code || "N/A"}
                            </p>
                        </div>

                        <button 
                            onClick={() => router.push(`/employee/${relative.employee_id}`)}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            {t('openProfile')}
                            <ChevronRight size={16} className={isAr ? "rotate-180" : ""} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('editRelative')}>
        <div className="p-1">
          <DynamicForm
            fields={[
              { name: "name", label: t('form.name'), type: "text", defaultValue: relative.name, required: true },
              { 
                name: "relation", 
                label: t('form.relation'), 
                type: "select", 
                options: [
                  { label: t('relations.Father'), value: "Father" },
                  { label: t('relations.Mother'), value: "Mother" },
                  { label: t('relations.Spouse'), value: "Spouse" },
                  { label: t('relations.Son'), value: "Son" },
                  { label: t('relations.Daughter'), value: "Daughter" },
                  { label: t('relations.Brother'), value: "Brother" },
                  { label: t('relations.Sister'), value: "Sister" },
                  { label: t('relations.Other'), value: "Other" },
                ], 
                defaultValue: relative.relation, 
                required: true 
              },
              { name: "phone", label: t('form.phone'), type: "text", defaultValue: relative.phone, required: true },
            ]}
            onSubmit={handleSubmit}
              error={formError}
            success={formSuccess}
          >
            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}