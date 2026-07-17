"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  PieChart, ArrowLeft, CalendarCheck, User, 
  Clock, Wallet, FileText, Briefcase, History,
  Info, ShieldCheck, Activity
} from "lucide-react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { contractLeaveService } from "../service";
import { contractService, leaveTypeService } from "@/lib/services";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function ContractLeaveDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [leaveData, setLeaveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<{
    contracts: { label: string; value: string | number }[];
    leaveTypes: { label: string; value: string | number }[];
  }>({
    contracts: [],
    leaveTypes: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await contractLeaveService.getById(id);
      setLeaveData(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError("Failed to fetch contract leave details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isValidId]);

  const fetchOptions = useCallback(async () => {
      try {
        const [contractsRes, leaveTypesRes] = await Promise.all([
          contractService.getAll({ limit: 1000 }),
          leaveTypeService.getAll({ limit: 1000 })
        ]);

        setOptions({
          contracts: contractsRes.data.map((c: any) => ({ 
            label: `${c.Employee?.code} - ${c.Employee?.full_name}`, 
            value: c.id 
          })),
          leaveTypes: leaveTypesRes.data.map((lt: any) => ({ 
            label: lt.name, 
            value: lt.id 
          }))
        });
      } catch (e) { notify.handleApiError(e as { message?: string }); }
  }, []);

  useEffect(() => { 
      if (!isValidId) {
          setIsLoading(false);
          return;
      }
      {
          fetchData(); 
          fetchOptions();
      }
  }, [id, isValidId, fetchData, fetchOptions]);

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);

    setFormSuccess(null);
    try {
      await contractLeaveService.update(id, formData);
      notify.success(isAr ? "تم تحديث الرصيد بنجاح" : "Leave balance updated successfully");

      setFormSuccess(isAr ? "تم تحديث الرصيد بنجاح" : "Leave balance updated successfully");
      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setFormError(err?.message || (isAr ? "فشلت العملية" : "Operation failed"));
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

  if (!leaveData) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  
  const fields = [
    { name: "contract_id", label: isAr ? "الموظف / العقد" : "Employee / Contract", type: "searchable-select", options: options.contracts, required: true },
    { name: "leave_type_id", label: isAr ? "نوع الإجازة" : "Leave Type", type: "searchable-select", options: options.leaveTypes, required: true },
    { name: "used_days", label: isAr ? "الأيام المستخدمة" : "Used Days", type: "number", required: true },
    { name: "year", label: isAr ? "السنة" : "Year", type: "number", required: true },
  ].map((f: any) => ({ ...f, defaultValue: leaveData[f.name] }));

  const DataRow = ({ label, value, icon: Icon, valueClass = "text-slate-800" }: any) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white shadow-sm rounded-lg text-slate-400 group-hover:text-rose-600 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-sm font-black ${valueClass}`}>{value || "—"}</span>
    </div>
  );

  const usagePercent = Math.min((parseFloat(leaveData.used_days) / parseFloat(leaveData.LeaveType?.annual_balance || 1)) * 100, 100);

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-10 text-white relative">
          <div className="absolute right-0 bottom-0 p-10 opacity-10">
            <PieChart size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
                <CalendarCheck size={48} className="text-rose-100" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tight">{leaveData.LeaveType?.name || (isAr ? "رصيد إجازة" : "Leave Balance")}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-rose-100 font-bold text-sm">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg"><Activity size={16}/> {leaveData.year}</div>
                  <div className="flex items-center gap-2"><PieChart size={16}/> {leaveData.used_days} {isAr ? "أيام مستخدمة" : "Days Used"}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <EditButton onClick={() => setIsModalOpen(true)} className="bg-white/10 hover:bg-white/20 border-white/20 text-white" />
              <button onClick={() => router.back()} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs transition-all hover:bg-slate-100 flex items-center gap-2 shadow-xl">
                <ArrowLeft size={18} className={isAr ? "rotate-180" : ""} /> {isAr ? "رجوع" : "Back"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Balance Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white"><PieChart size={16}/></div>
                    <h3 className="font-black text-rose-800 text-sm">{isAr ? "تفاصيل الرصيد" : "Balance Details"}</h3>
                </div>
                <div className="p-3">
                    <DataRow icon={PieChart} label={isAr ? "الأيام المستخدمة" : "Used Days"} value={`${leaveData.used_days} ${isAr ? 'أيام' : 'Days'}`} valueClass="text-rose-600 font-black text-lg" />
                    <DataRow icon={CalendarCheck} label={isAr ? "الرصيد السنوي للإجازة" : "Annual Balance"} value={`${leaveData.LeaveType?.annual_balance || 0} ${isAr ? 'يوم' : 'Days'}`} />
                    <DataRow icon={ShieldCheck} label={isAr ? "يؤثر على الخصم" : "Affects Deduction"} value={leaveData.LeaveType?.affects_deduction ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")} valueClass={leaveData.LeaveType?.affects_deduction ? "text-rose-600" : "text-emerald-500"} />
                    <DataRow icon={Activity} label={isAr ? "العام المالي" : "Financial Year"} value={leaveData.year} />
                    
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-600">{isAr ? "معدل الاستهلاك" : "Usage Rate"}</span>
                        <span className="text-xs font-black text-rose-600">{usagePercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${usagePercent}%` }}></div>
                      </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Contract & System Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><FileText size={16}/></div>
                        <h3 className="font-black text-indigo-800 text-sm">{isAr ? "معلومات العقد" : "Contract Info"}</h3>
                    </div>
                    <button onClick={() => router.push(`/contracts/${leaveData.contract_id}`)} className="text-xs font-bold text-indigo-600 bg-indigo-100/50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        {isAr ? "عرض العقد" : "View Contract"}
                    </button>
                </div>
                <div className="p-3">
                    <DataRow icon={Briefcase} label={isAr ? "المسمى الوظيفي" : "Job Title"} value={leaveData.EmployeeContract?.job_title} />
                    <DataRow icon={Wallet} label={isAr ? "الراتب الأساسي" : "Base Salary"} value={`${Number(leaveData.EmployeeContract?.base_salary).toLocaleString()} EGP`} />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <History size={20} className="text-slate-600"/> 
                    <h3 className="font-black text-slate-800 text-sm">{isAr ? "سجل النظام" : "System Audit"}</h3>
                </div>
                <div className="p-3">
                    <DataRow icon={Clock} label={isAr ? "تاريخ التخصيص" : "Created At"} value={new Date(leaveData.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                    <DataRow icon={Clock} label={isAr ? "وقت التحديث" : "Updated At"} value={new Date(leaveData.updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAr ? "تعديل رصيد الإجازة" : "Edit Leave Balance"}>
        <div className="max-h-[75vh] overflow-y-auto px-1">
          <DynamicForm 
            fields={fields} 
            onSubmit={handleFormSubmit}
            error={formError}
            success={formSuccess}
          >
            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label={isAr ? "تحديث الرصيد" : "Update Balance"} />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
