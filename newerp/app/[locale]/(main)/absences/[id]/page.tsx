"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { 
  UserX, 
  ArrowLeft, 
  Hash, 
  ShieldAlert,
  ChevronRight,
  CalendarDays,
  FileText,
  User,
  Clock,
  Scale,
  Activity,
  CheckCircle2
} from "lucide-react";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import DeleteRestoreButton from "@/components/ui/deleteButtom";
import { RoleGuard } from "@/components/shared";
import { absenceService } from "../service";
import { absenceTypeService } from "@/lib/services";

// استيراد المكونات ديناميكياً
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function AbsenceDetailsPage() {
  const t = useTranslations("absences");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [absence, setAbsence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [options, setOptions] = useState<{
    absenceTypes: { label: string; value: number }[];
  }>({
    absenceTypes: [],
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const typeRes = await absenceTypeService.getAll({ limit: 1000 });
        setOptions({
          absenceTypes: typeRes.data.map((b: any) => ({ label: b.name, value: b.id }))
        });
      } catch (e) {
        notify.handleApiError(e as { message?: string });
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await absenceService.getById(id);

        if (!data) {
          throw new Error("لم يتم العثور على بيانات الغياب");
        }

        setAbsence(data);
      } catch (err: any) {
        notify.handleApiError(err as { message?: string });
        setError(err?.message || "Failed to load absence details");
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

  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await absenceService.update(id, {
        ...formData,
        absence_type_id: Number(formData.absence_type_id),
        deduction_days: Number(formData.deduction_days)
      });
      notify.success(isAr ? "تم التحديث بنجاح" : "Updated successfully");

      setFormSuccess(isAr ? "تم التحديث بنجاح" : "Updated successfully");
      setTimeout(() => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
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

  if (!absence) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }


  
  const detailItems = [
    { label: isAr ? "نوع الغياب" : "Absence Type", value: absence.AbsenceType?.name, icon: <Activity size={18} className="text-rose-500" /> },
    { label: isAr ? "تاريخ الغياب" : "Absence Date", value: absence.absence_date, icon: <CalendarDays size={18} className="text-indigo-500" /> },
    { label: isAr ? "أيام الخصم" : "Deduction Days", value: `${absence.deduction_days} ${isAr ? 'يوم' : 'Days'}`, icon: <Scale size={18} className="text-amber-500" /> },
  ];

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4 mb-2 text-sm text-slate-500">
        <button onClick={() => router.push(`/${params.locale}/absences`)} className="hover:text-indigo-600 transition-colors">
          {isAr ? "سجل الغياب" : "Absences"}
        </button>
        <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
        <span className="font-bold text-slate-800">{absence.Employee?.full_name}</span>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 text-white relative">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <UserX size={150} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-2xl">
                <UserX size={40} className="text-rose-300" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">{absence.Employee?.full_name}</h1>
                <div className="flex flex-wrap gap-4">
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Hash size={14} className="text-indigo-300" /> {absence.Employee?.code}
                    </span>
                    <span className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-full text-[11px] font-black text-rose-200 uppercase tracking-widest">
                        {absence.AbsenceType?.name}
                    </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <EditButton 
                onClick={() => setIsModalOpen(true)} 
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl transition-all shadow-xl backdrop-blur-md" 
              />
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs transition-all hover:bg-slate-100 flex items-center gap-2 shadow-xl h-12"
              >
                <ArrowLeft size={18} className={isAr ? "rotate-180" : ""} />
                {isAr ? "رجوع" : "Back"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {detailItems.map((item, index) => (
              <div key={index} className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-500 group cursor-pointer shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 group-hover:border-indigo-200 group-hover:shadow-lg transition-all duration-500">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" /> {isAr ? "ملاحظات وتفاصيل إضافية" : "Additional Notes & Details"}
              </h4>
              <p className="text-base font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {absence.notes || (isAr ? "لا توجد ملاحظات مسجلة لهذا الغياب" : "No notes recorded for this absence")}
              </p>
            </div>

            <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-inner flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-400" /> {isAr ? "حالة السجل في النظام" : "System Record Status"}
                </h4>
                {absence.is_deleted ? (
                  <div className="flex items-center gap-5 p-6 bg-rose-50 rounded-[1.5rem] border border-rose-100 shadow-sm">
                    <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
                      <UserX size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-rose-700">{isAr ? "سجل محذوف" : "Deleted Record"}</p>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{isAr ? "هذا الغياب تم حذفه من النظام" : "This absence has been removed"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-5 p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-emerald-700">{isAr ? "سجل نشط" : "Active Record"}</p>
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{isAr ? "هذا السجل ساري ضمن التقارير" : "This record is currently active"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isAr ? "تعديل بيانات الغياب" : "Edit Absence Details"}
      >
        <div className="p-1 max-h-[75vh] overflow-y-auto">
          {formError && <div className="mb-4 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-sm font-bold">{formError}</div>}
          {formSuccess && <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-sm font-bold">{formSuccess}</div>}
          
          <DynamicForm
            onSubmit={handleFormSubmit}
            fields={[
              {
                name: "employee_id",
                label: "الموظف",
                type: "text",
                disabled: true,
                defaultValue: absence.Employee?.full_name,
              },
              {
                name: "absence_type_id",
                label: "نوع الغياب",
                type: "searchable-select",
                options: options.absenceTypes,
                required: true,
                defaultValue: absence.absence_type_id
              },
              {
                name: "absence_date",
                label: "تاريخ الغياب",
                type: "date",
                required: true,
                defaultValue: absence.absence_date
              },
              {
                name: "deduction_days",
                label: "أيام الخصم",
                type: "number",
                required: true,
                defaultValue: absence.deduction_days
              },
              {
                name: "notes",
                label: "ملاحظات",
                type: "textarea",
                defaultValue: absence.notes
              }
            ]}
          >
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
              <DeleteRestoreButton 
                isDeleted={!!absence.is_deleted}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                endpoint="absence"
                id={id}
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-xs hover:bg-slate-200 transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <SaveButton 
                  isSubmitting={isSubmitting} 
                  label={isAr ? "حفظ التعديلات" : "Save Changes"}
                />
              </div>
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
