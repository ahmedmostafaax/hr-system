"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  FileSignature, ArrowLeft, Calendar, Building2, User, 
  Clock, ShieldCheck, Wallet, FileText, CheckCircle2, 
  AlertCircle, Download, Briefcase, ChevronRight, Hash,
  History, CalendarDays, Timer, Coins, PieChart, Info
} from "lucide-react";
import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { contractService } from "../service";
import {
  employeeService,
  departmentService,
  insuranceSettingsService,
  shiftService,
} from "@/lib/services";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function ContractDetailsPage() {
  const t = useTranslations("contracts");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<{
    employees: { label: string; value: string | number }[];
    departments: { label: string; value: string | number }[];
    insurance: { label: string; value: string | number }[];
    shifts: { label: string; value: string | number }[];
  }>({
    employees: [],
    departments: [],
    insurance: [],
    shifts: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await contractService.getById(id);
      setContract(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError("Failed to fetch contract details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isValidId]);

  const fetchOptions = useCallback(async () => {
      try {
        const [emp, dept, ins, shft] = await Promise.all([
          employeeService.getAll({ limit: 1000 }),
          departmentService.getAll({ limit: 1000 }),
          insuranceSettingsService.getAll({ limit: 1000 }),
          shiftService.getAll({ limit: 1000 })
        ]);

        setOptions({
          employees: emp.data.map((e: any) => ({ label: `${e.code} - ${e.full_name}`, value: e.id })),
          departments: dept.data.map((d: any) => ({ label: d.name, value: d.id })),
          insurance: ins.data.map((i: any) => ({ label: `${i.employee_rate}% / ${i.company_rate}%`, value: i.id })),
          shifts: shft.data.map((s: any) => ({ label: s.name, value: s.id })),
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
      await contractService.update(id, formData);
      notify.success(isAr ? "تم تحديث العقد بنجاح" : "Contract updated successfully");

      setFormSuccess(isAr ? "تم تحديث العقد بنجاح" : "Contract updated successfully");
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

  if (!contract) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  
  // حساب إجمالي البدلات والراتب الكلي
  const totalAllowances = contract.allowances?.reduce((acc: number, curr: any) => acc + parseFloat(curr.amount), 0) || 0;
  const grossSalary = parseFloat(contract.base_salary) + totalAllowances;

  const fields = [
    { name: "employee_id", label: t('form.employee'), type: "searchable-select", options: options.employees, required: true },
    { name: "job_title", label: t('form.jobTitle'), type: "text", required: true },
    { name: "department_id", label: t('form.department'), type: "select", options: options.departments, required: true },
    { name: "base_salary", label: t('form.baseSalary'), type: "number", required: true },
    { name: "start_date", label: t('form.startDate'), type: "date", required: true },
    { name: "end_date", label: t('form.endDate'), type: "date" },
    { name: "duration_years", label: t('form.duration'), type: "number" },
    { name: "shift_id", label: t('form.shift'), type: "select", options: options.shifts, required: true },
    { name: "insurance_setting_id", label: t('form.insurance'), type: "select", options: options.insurance, required: true },
    { name: "status", label: t('form.status'), type: "select", options: [{label: "Active", value: "active"}, {label: "Expired", value: "expired"}], required: true },
    { name: "overtime_enabled", label: t('form.overtime'), type: "checkbox" },
    { name: "notes", label: t('form.notes'), type: "textarea" },
    { name: "attachment", label: t('form.attachment'), type: "text" },
  ].map((f: any) => ({ ...f, defaultValue: contract[f.name] }));

  const DataRow = ({ label, value, icon: Icon, valueClass = "text-slate-800" }: any) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white shadow-sm rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-sm font-black ${valueClass}`}>{value || "—"}</span>
    </div>
  );

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 text-white relative">
          <div className="absolute right-0 bottom-0 p-10 opacity-10">
            <FileSignature size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
                <Briefcase size={48} className="text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tight">{contract.job_title}</h1>
                  <span className={`px-4 py-1 rounded-full text-xs font-black border uppercase tracking-widest ${
                    contract.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {contract.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-indigo-100/60 font-bold text-sm">
                  <div className="flex items-center gap-2"><User size={16}/> {contract.Employee?.full_name}</div>
                  <div className="flex items-center gap-2"><Hash size={16}/> {contract.Employee?.code}</div>
                  <div className={`flex items-center gap-2 ${contract.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <CheckCircle2 size={16}/> {contract.is_active ? (isAr ? "نشط حالياً" : "Currently Active") : (isAr ? "متوقف" : "Suspended")}
                  </div>
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

        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-8 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contractual Data */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><FileText size={16}/></div>
                        <h3 className="font-black text-slate-800 text-sm">{isAr ? "بيانات التعاقد" : "Contractual Data"}</h3>
                    </div>
                    <div className="p-3">
                        <DataRow icon={Briefcase} label={isAr ? "المسمى الوظيفي" : "Job Title"} value={contract.job_title} />
                        <DataRow icon={CalendarDays} label={isAr ? "تاريخ التعيين" : "Start Date"} value={new Date(contract.start_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')} />
                        <DataRow icon={Calendar} label={isAr ? "تاريخ الانتهاء" : "End Date"} value={contract.end_date ? new Date(contract.end_date).toLocaleDateString() : (isAr ? "مفتوح" : "Open")} />
                        <DataRow icon={Timer} label={isAr ? "المدة" : "Duration"} value={contract.duration_years ? `${contract.duration_years} ${isAr ? 'سنوات' : 'Years'}` : "—"} />
                    </div>
                </div>

                {/* Allowances Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white"><Coins size={16}/></div>
                        <h3 className="font-black text-amber-800 text-sm">{isAr ? "البدلات" : "Allowances"}</h3>
                    </div>
                    <div className="p-3 space-y-1">
                        {contract.allowances?.map((allowance: any) => (
                            <div key={allowance.id} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-50">
                                <span className="text-xs font-bold text-slate-600">{allowance.Allowance?.name}</span>
                                <span className="text-sm font-black text-slate-800">{Number(allowance.amount).toLocaleString()} EGP</span>
                            </div>
                        ))}
                        {contract.allowances?.length === 0 && <p className="text-center py-4 text-xs text-slate-400">{isAr ? "لا توجد بدلات" : "No allowances"}</p>}
                        <div className="p-3 mt-2 bg-amber-500 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-amber-100">
                             <span className="text-[10px] font-black uppercase">{isAr ? "إجمالي البدلات" : "Total Allowances"}</span>
                             <span className="text-sm font-black">{totalAllowances.toLocaleString()} EGP</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leave Balances Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100"><PieChart size={20}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-sm">{isAr ? "أرصدة الإجازات" : "Leave Balances"}</h3>
                            <p className="text-[10px] text-slate-400 font-bold">{isAr ? "عام" : "Year"} 2026</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contract.leaveBalances?.map((leave: any) => (
                        <div key={leave.id} className="p-4 rounded-3xl border border-slate-100 bg-white hover:border-rose-200 transition-all group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-black text-slate-700">{leave.LeaveType?.name}</span>
                                <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full">{leave.used_days} {isAr ? "أيام مستخدمة" : "Days Used"}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 rounded-full group-hover:bg-rose-600 transition-all" 
                                    style={{ width: `${Math.min((parseFloat(leave.used_days) / 30) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Salary & Audit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                        <ShieldCheck size={20} className="text-emerald-600"/> 
                        <h3 className="font-black text-emerald-800 text-sm">{isAr ? "التأمينات والراتب الكلي" : "Gross Salary & Insurance"}</h3>
                    </div>
                    <div className="p-3">
                        <DataRow icon={Wallet} label={isAr ? "الراتب الإجمالي" : "Gross Salary"} value={`${grossSalary.toLocaleString()} EGP`} valueClass="text-emerald-700 font-black text-lg" />
                        <DataRow icon={ShieldCheck} label={isAr ? "نسبة الموظف" : "Employee Rate"} value={contract.insuranceSetting ? `${contract.insuranceSetting.employee_rate}%` : "—"} />
                        <DataRow icon={ShieldCheck} label={isAr ? "نسبة الشركة" : "Company Rate"} value={contract.insuranceSetting ? `${contract.insuranceSetting.company_rate}%` : "—"} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                        <History size={20} className="text-slate-600"/> 
                        <h3 className="font-black text-slate-800 text-sm">{isAr ? "سجل النظام" : "System Audit"}</h3>
                    </div>
                    <div className="p-3">
                        <DataRow icon={User} label={isAr ? "بواسطة" : "Created By"} value={contract.creator?.name} />
                        <DataRow icon={Calendar} label={isAr ? "تاريخ الإنشاء" : "Created At"} value={new Date(contract.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                        <DataRow icon={User} label={isAr ? "آخر تعديل" : "Updated By"} value={contract.updater?.name} />
                        <DataRow icon={Clock} label={isAr ? "وقت التحديث" : "Updated At"} value={new Date(contract.updatedAt).toLocaleString()} />
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
              {/* Department & Shift Card */}
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                  <div className="relative z-10">
                      <Building2 size={32} className="mb-6 opacity-80" />
                      <h3 className="text-xl font-black mb-1">{contract.Department?.name}</h3>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-8">{isAr ? "القسم" : "Department"}</p>
                      
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                          <div className="flex items-center gap-3 mb-2">
                              <Clock size={16} />
                              <span className="text-sm font-black">{contract.Shift?.name}</span>
                          </div>
                          <div className="text-[10px] font-bold opacity-70">
                              {contract.Shift?.start_time} — {contract.Shift?.end_time}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Status & Settings */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">{isAr ? "خيارات إضافية" : "Settings"}</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-3">
                              <Timer size={18} className={contract.overtime_enabled ? "text-emerald-500" : "text-slate-300"}/>
                              <span className="text-xs font-bold text-slate-700">{isAr ? "الوقت الإضافي" : "Overtime"}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${contract.overtime_enabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-3">
                              <ShieldCheck size={18} className="text-indigo-500"/>
                              <span className="text-xs font-bold text-slate-700">{isAr ? "الحالة التأمينية" : "Insurance"}</span>
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{isAr ? "مؤمن" : "Insured"}</span>
                      </div>
                  </div>

                  {contract.notes && (
                    <div className="mt-8">
                        <div className="text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 leading-relaxed italic">
                           <Info size={14} className="mb-2 text-slate-400" />
                           "{contract.notes}"
                        </div>
                    </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAr ? "تعديل بيانات العقد" : "Edit Contract Details"}>
        <div className="max-h-[75vh] overflow-y-auto px-1">
          <DynamicForm 
            fields={fields} 
            onSubmit={handleFormSubmit}
 
            error={formError}
            success={formSuccess}
          >
            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label={isAr ? "تحديث البيانات" : "Update Contract"} />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}