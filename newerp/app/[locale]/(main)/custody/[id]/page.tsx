"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Package, 
  ArrowRight, 
  Calendar, 
  User, 
  Clipboard, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Edit2
} from "lucide-react";
import dynamic from "next/dynamic";
import { custodyService, type Custody } from "../service";
import { employeeService } from "@/lib/services";
import Loading from "@/components/ui/Loading";
import { RoleGuard } from "@/components/shared";

type CustodyDetail = Custody & {
  fromEmployee?: { full_name?: string; code?: string };
  toEmployee?: { full_name?: string; code?: string };
};

// استيراد الأنواع
import type { FieldDef } from "@/components/ui/DynamicForm";

// المكونات المحملة ديناميكياً
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });
const SaveButton = dynamic(() => import("@/components/ui/SaveButton"), { ssr: false });

export default function CustodyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;
  const [custody, setCustody] = useState<CustodyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<{label: string, value: any}[]>([]);

  const fetchCustody = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await custodyService.getById(id);
      setCustody(data);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      setError((err as { message?: string })?.message || "فشل تحميل بيانات العهدة");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    fetchCustody();
    
    // جلب خيارات الموظفين للمودال
    employeeService.getAll({ limit: 1000 }).then((res) => {
      setEmployeeOptions(res.data.map((emp: any) => ({
        label: `${emp.code} - ${emp.full_name}`,
        value: emp.id
      })));
    });
  }, [id, isValidId]);

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        from_employee_id: Number(formData.from_employee_id),
        to_employee_id: Number(formData.to_employee_id),
      };

      await custodyService.update(id, payload);
      notify.success("تم تحديث بيانات العهدة بنجاح");
      await fetchCustody(); // تحديث البيانات في الصفحة
      setIsModalOpen(false);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields: FieldDef[] = ([
    { 
      name: "item_name", 
      label: "اسم العهدة / الجهاز", 
      type: "text", 
      required: true, 
      placeholder: "مثال: Laptop Dell Precision" 
    },
    { 
      name: "from_employee_id", 
      label: "مُسلم العهدة", 
      type: "searchable-select", 
      options: employeeOptions, 
      required: true 
    },
    { 
      name: "to_employee_id", 
      label: "مستلم العهدة", 
      type: "searchable-select", 
      options: employeeOptions, 
      required: true 
    },
    { 
      name: "transfer_type", 
      label: "نوع العملية", 
      type: "select", 
      options: [
        { label: "تسليم (Handover)", value: "handover" },
        { label: "إرجاع (Return)", value: "return" },
        { label: "صيانة (Maintenance)", value: "maintenance" }
      ],
      required: true,
      defaultValue: "handover"
    },
    { 
      name: "transfer_date", 
      label: "تاريخ النقل", 
      type: "date", 
      required: true,
      defaultValue: new Date().toISOString().split('T')[0]
    },
    { 
      name: "notes", 
      label: "ملاحظات الحالة", 
      type: "textarea", 
      placeholder: "اكتب حالة الجهاز أو سبب النقل..." 
    },
  ] as FieldDef[]).map(f => ({ ...f, defaultValue: custody ? (custody as any)[f.name] : f.defaultValue }));

  if (isLoading) return (<RoleGuard permission="read:employees"><Loading className="min-h-screen" /></RoleGuard>);

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

  if (!custody) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard permission="read:employees">
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span>عودة للمسجل</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
          >
            <Edit2 size={18} />
            <span>تعديل البيانات</span>
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-bold">
            <Clock size={16} />
            <span>{new Date(custody.transfer_date || "").toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 shadow-inner">
            <Package size={48} />
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{custody.item_name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                custody.transfer_type === 'handover' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : custody.transfer_type === 'receive'
                  ? 'bg-blue-50 border-blue-100 text-blue-600'
                  : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                {custody.transfer_type}
              </span>
              <span className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 border border-slate-200">
                #{custody.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* From Employee */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
            <User size={32} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 mb-1">المُسلم</span>
          <h3 className="font-bold text-slate-800">{custody.fromEmployee?.full_name}</h3>
          <span className="text-xs font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-2">{custody.fromEmployee?.code}</span>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-0.5 w-full bg-gradient-to-r from-slate-200 via-indigo-400 to-slate-200 relative hidden md:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border-2 border-indigo-100 shadow-lg shadow-indigo-100">
              <ArrowRight className="text-indigo-600" />
            </div>
          </div>
          <div className="md:hidden">
            <ArrowRight size={32} className="rotate-90 text-indigo-400" />
          </div>
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-indigo-50 shadow-sm">
            نقل عهدة
          </div>
        </div>

        {/* To Employee */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-50">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
            <User size={32} />
          </div>
          <span className="text-[10px] uppercase font-black text-indigo-400 mb-1">المستلم الحالي</span>
          <h3 className="font-bold text-slate-800">{custody.toEmployee?.full_name}</h3>
          <span className="text-xs font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-2">{custody.toEmployee?.code}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Information Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">تفاصيل العملية</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-500">
                <Calendar size={18} />
                <span className="text-sm font-medium">تاريخ النقل</span>
              </div>
              <span className="font-bold text-slate-700">{custody.transfer_date}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-500">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">الحالة الحالية</span>
              </div>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} />
                مفعلة
              </span>
            </div>
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clipboard size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">ملاحظات</h2>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[140px] relative">
            <p className="text-slate-600 leading-relaxed italic">
              {custody.notes || "لا يوجد ملاحظات إضافية لهذه العملية."}
            </p>
            <div className="absolute bottom-4 right-4 text-slate-300">
              <History size={24} opacity={0.2} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Footer */}
      <div className="text-center pb-12">
            <p className="text-xs text-slate-400">آخر تحديث في {new Date(custody.transfer_date || "").toLocaleString()}</p>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تعديل بيانات العهدة">
        <div className="p-1">
          <DynamicForm key={custody.id} fields={fields} onSubmit={handleSubmit}>
            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label="تحديث البيانات" />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
