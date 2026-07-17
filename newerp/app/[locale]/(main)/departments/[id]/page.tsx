"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  Building2, 
  ArrowLeft, 
  Calendar, 
  User, 
  Activity, 
  Layers, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { departmentService, type Department } from "../service";

// Lazy Loaded Components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

import type { FieldDef } from "@/components/ui/DynamicForm";

export default function DepartmentDetailsPage() {
  const t = useTranslations("departments");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await departmentService.getById(id);
        setDepartment(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAllDepts = async () => {
      try {
        const response = await departmentService.getAll();
        setAllDepartments(response.data || []);
      } catch (e) {
        notify.handleApiError(e as { message?: string });
      }
    };

    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    {
      fetchDetails();
      fetchAllDepts();
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
      const payload: any = {
        name: formData.name,
        type: formData.type,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      };

      await departmentService.update(id, payload);
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

  if (!department) {
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
      defaultValue: department.name
    },
    { 
      name: "type", 
      label: t('form.type'), 
      type: "text", 
      required: true, 
      placeholder: t('form.typePlaceholder'),
      defaultValue: department.type
    },
    { 
      name: "parent_id", 
      label: t('form.parent'), 
      type: "select", 
      placeholder: t('form.parentNone'),
      options: allDepartments
        .filter(d => d.id !== department.id) 
        .map(d => ({ label: d.name, value: d.id })),
      defaultValue: department.parent_id || ""
    },
  ];

  const detailItems = [
    { 
      label: t('table.name'), 
      value: department.name, 
      icon: <Building2 size={18} className="text-indigo-500" />,
      className: "col-span-2"
    },
    { 
      label: t('table.type'), 
      value: department.type, 
      icon: <Layers size={18} className="text-purple-500" /> 
    },
    { 
      label: t('table.parent'), 
      value: department.parent?.name || allDepartments.find(d => d.id === department.parent_id)?.name || (isAr ? "لا يوجد" : "None"), 
      icon: <ListTree size={18} className="text-amber-500" /> 
    },
    { 
      label: t('table.status'), 
      value: (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${department.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
          {department.isActive ? t('table.active') : t('table.inactive')}
        </span>
      ), 
      icon: <Activity size={18} className={department.isActive ? "text-emerald-500" : "text-rose-500"} /> 
    },
    { 
      label: t('table.createdAt'), 
      value: department.createdAt
        ? new Date(department.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        : "—", 
      icon: <Calendar size={18} className="text-slate-500" /> 
    },
    { 
      label: isAr ? "آخر تحديث" : "Last Update", 
      value: department.updatedAt
        ? new Date(department.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })
        : "—", 
      icon: <Clock size={18} className="text-slate-400" /> 
    }
  ];

  return (
    <RoleGuard permission="read:settings">
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/departments`)} className="hover:text-indigo-600 transition-colors">
          {t('title')}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{department.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner/Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <Building2 size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{department.name}</h1>
                <p className="text-indigo-100 mt-1 font-medium flex items-center gap-2">
                  <Layers size={14} />
                  {department.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EditButton onClick={handleEditClick} className="bg-white/10 hover:bg-white/20 border-white/30 text-white" />
              <button 
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
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
              <div 
                key={index} 
                className={`p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/50 transition-all duration-300 group ${item.className || ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-slate-800 font-bold text-lg">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Description or Additional Info if needed */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              {isAr ? "معلومات إضافية" : "Additional Information"}
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {isAr 
                ? "هذا القسم هو جزء من الهيكل التنظيمي للشركة. يتم استخدامه لتنظيم الموظفين وتوزيع المهام الإدارية والمالية بناءً على نوع القسم وموقعه في الهيكل."
                : "This department is part of the company's organizational structure. It is used to organize employees and distribute administrative and financial tasks based on the department type and its position in the hierarchy."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('editDepartment')}
      >
        <DynamicForm 
          key={department.id + refreshTrigger}
          fields={fields}
          onSubmit={handleFormSubmit}
          error={formError}
          success={formSuccess}
        >
          <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
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

// Dummy icon for ListTree since it wasn't imported from lucide-react in the top but used below
function ListTree({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12h-8" />
      <path d="M21 6H8" />
      <path d="M21 18h-8" />
      <path d="M3 6v4c0 1.1.9 2 2 2h3" />
      <path d="M3 10v6c0 1.1.9 2 2 2h3" />
    </svg>
  );
}

