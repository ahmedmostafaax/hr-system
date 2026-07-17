"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  FileText, 
  ArrowLeft, 
  ShieldAlert,
  ChevronRight,
  Download,
  Eye,
  Briefcase,
  Calendar,
  Clock,
  User,
  Hash,
  ExternalLink,
  ShieldCheck,
  CalendarDays
} from "lucide-react";
import dynamic from "next/dynamic";
import { documentService, type EmployeeDocument } from "../service";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import Loading from "@/components/ui/Loading";
import { RoleGuard } from "@/components/shared";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function EmployeeDocumentDetailsPage() {
  const t = useTranslations("documents");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [doc, setDoc] = useState<EmployeeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const data = await documentService.getById(id);
      setDoc(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError(err?.message || "Failed to load document details");
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
      await documentService.update(id, formData);
      notify.success(isAr ? "تم التحديث بنجاح" : "Updated successfully");
      setFormSuccess(isAr ? "تم التحديث بنجاح" : "Updated successfully");
      setTimeout(() => {
        setIsModalOpen(false);
        fetchDetails();
      }, 1500);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setFormError(err?.message || "Operation failed");
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

  if (!doc) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }


  
  // مصفوفة تفاصيل الوقت والتاريخ
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : "—");
  const fmtTime = (d?: string) => (d ? new Date(d).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US') : "—");
  const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString(isAr ? 'ar-EG' : 'en-US') : "—");

  const timeDetails = [
    { label: t('uploadDate'), value: fmtDate(doc.uploaded_at), icon: <CalendarDays className="text-emerald-500" size={18} /> },
    { label: t('uploadTime'), value: fmtTime(doc.uploaded_at), icon: <Clock className="text-indigo-500" size={18} /> },
    { label: t('createdAt'), value: fmtDateTime(doc.createdAt), icon: <Calendar className="text-slate-400" size={18} /> },
    { label: t('updatedAt'), value: fmtDateTime(doc.updatedAt), icon: <Clock className="text-amber-500" size={18} /> },
  ];

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <button onClick={() => router.push('/employeeDocument')} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="text-slate-800">{doc.doc_name}</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <FileText size={240} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <FileText size={40} className="text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black tracking-tight">{doc.doc_name}</h1>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${doc.is_deleted ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'}`}>
                        {doc.is_deleted ? t('deleted') : t('active')}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                        <Hash size={14} /> ID: {doc.id}
                    </div>
                    <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                        <User size={14} /> {doc.Employee?.full_name}
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
                className="px-6 py-2.5 bg-white text-slate-900 rounded-2xl font-black text-xs transition-all hover:bg-slate-100 flex items-center gap-2"
              >
                <ArrowLeft size={16} className={isAr ? "rotate-180" : ""} />
                {t('back')}
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Info */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {timeDetails.map((item, idx) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                            </div>
                            <div className="text-slate-800 font-bold">{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* File Preview Card */}
                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                            <ExternalLink size={28} />
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-900 text-sm">{t('fileLink')}</h4>
                            <p className="text-xs text-indigo-600/70 font-medium truncate max-w-[200px] md:max-w-md">{doc.file_path}</p>
                        </div>
                    </div>
                    <a 
                        href={doc.file_path} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Download size={16} />
                        {t('openLink')}
                    </a>
                </div>
            </div>

            {/* Employee Sidebar Card */}
            <div className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">
                            <ShieldCheck size={14} />
                            {t('owner')}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">{doc.Employee?.full_name}</h3>
                        <p className="text-slate-500 font-bold text-sm mb-6 flex items-center gap-2">
                            <Briefcase size={14} /> {t('code')}: {doc.Employee?.code}
                        </p>
                        
                        <button 
                            onClick={() => router.push(`/employees/${doc.employee_id}`)}
                            className="w-full py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            {t('profile')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('editDoc')}>
        <div className="p-1">
          <DynamicForm
            fields={[
              { name: "doc_name", label: t('form.docName'), type: "text", defaultValue: doc.doc_name, required: true },
              { name: "file_path", label: t('form.file'), type: "text", defaultValue: doc.file_path, required: true },
              { name: "uploaded_at", label: t('uploadDate'), type: "date", defaultValue: doc.uploaded_at?.split('T')[0] },
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