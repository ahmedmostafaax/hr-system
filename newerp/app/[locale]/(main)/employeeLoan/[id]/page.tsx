"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Banknote, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  Coins,
  History,
  AlertCircle,
  Hash,
  Wallet,
  CreditCard,
  TrendingUp,
  Receipt
} from "lucide-react";
import dynamic from "next/dynamic";
import { loanService, type EmployeeLoan } from "../service";
import { employeeService } from "@/lib/services";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import { RoleGuard } from "@/components/shared";
import api from "@/lib/api";

// Types
import type { FieldDef } from "@/components/ui/DynamicForm";

// Dynamic components
const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });
const SaveButton = dynamic(() => import("@/components/ui/SaveButton"), { ssr: false });

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;
  const [loan, setLoan] = useState<EmployeeLoan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  
  const [options, setOptions] = useState<{
    employees: { label: string; value: string | number }[];
  }>({
    employees: [],
  });

  const fetchLoan = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loanService.getById(id);
      setLoan(data);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      setError((err as { message?: string })?.message || "Failed to fetch loan details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidId) {
      setIsLoading(false);
      return;
    }
    fetchLoan();
    
    // Fetch options for the modal
    const fetchOptions = async () => {
      try {
        const empRes = await employeeService.getAll({ limit: 1000 });

        setOptions({
          employees: empRes.data.map((e: any) => ({ label: `${e.code} - ${e.full_name}`, value: e.id }))
        });
      } catch (e) {
        notify.handleApiError(e as { message?: string });
      }
    };
    fetchOptions();
  }, [id, isValidId]);

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        employee_id: Number(formData.employee_id),
        amount: Number(formData.amount),
        installment_amount: Number(formData.installment_amount),
        paid_amount: Number(formData.paid_amount || 0),
      };

      await loanService.update(id, payload);
      notify.success("تم تحديث بيانات السلفة بنجاح");
      await fetchLoan();
      setIsModalOpen(false);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setApprovalLoading(true);
    try {
      await api.patch(`/employeeLoan/${id}`, { approval_status: "approved" });
      notify.success("تم الاعتماد بنجاح");
      await fetchLoan();
    } catch (error: any) {
      notify.error(error?.message || "فشل في الاعتماد");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleReject = async () => {
    setApprovalLoading(true);
    try {
      await api.patch(`/employeeLoan/${id}`, { approval_status: "rejected" });
      notify.success("تم الرفض");
      await fetchLoan();
    } catch (error: any) {
      notify.error(error?.message || "فشل في الرفض");
    } finally {
      setApprovalLoading(false);
    }
  };

  const fields: FieldDef[] = ([
    { 
      name: "employee_id", 
      label: "الموظف", 
      type: "searchable-select", 
      options: options.employees, 
      required: true 
    },
    { 
      name: "type", 
      label: "نوع المعاملة", 
      type: "select", 
      options: [
        { label: "قرض (Loan)", value: "loan" },
        { label: "سلفة (Advance)", value: "advance" }
      ],
      required: true,
      defaultValue: "loan"
    },
    { 
      name: "amount", 
      label: "المبلغ الإجمالي", 
      type: "number", 
      required: true, 
      placeholder: "5000" 
    },
    { 
      name: "installment_amount", 
      label: "مبلغ القسط الشهري", 
      type: "number", 
      required: true, 
      placeholder: "1000" 
    },
    { 
      name: "paid_amount", 
      label: "المبلغ المدفوع مسبقاً", 
      type: "number", 
      defaultValue: 0 
    },
    { 
      name: "grant_date", 
      label: "تاريخ المنح", 
      type: "date", 
      required: true,
      defaultValue: new Date().toISOString().split('T')[0]
    },
    { 
      name: "status", 
      label: "الحالة", 
      type: "select", 
      options: [
        { label: "نشط (Active)", value: "active" },
        { label: "تم التسوية (Settled)", value: "settled" }
      ],
      required: true,
      defaultValue: "active"
    },
  ] as FieldDef[]).map(f => ({ ...f, defaultValue: loan ? (loan as any)[f.name] : f.defaultValue }));

  const isAr = params?.locale === "ar";
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

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

  if (!loan) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  const remaining = Number(loan.amount) - Number(loan.paid_amount);

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-10 text-white relative">
          <div className="absolute right-0 bottom-0 p-10 opacity-10">
            <Banknote size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
                <Wallet size={48} className="text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tight">{loan.type === 'loan' ? (isAr ? 'قرض' : 'Loan') : (isAr ? 'سلفة' : 'Advance')}</h1>
                  <span className={`px-4 py-1 rounded-full text-xs font-black border uppercase tracking-widest ${
                    loan.status === 'active' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                    loan.status === 'settled' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>
                    {loan.status === 'active' ? (isAr ? "نشط" : "Active") : 
                     (isAr ? "تم التسوية" : "Settled")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-indigo-100/60 font-bold text-sm">
                  <div className="flex items-center gap-2"><User size={16}/> {loan.Employee?.full_name}</div>
                  <div className="flex items-center gap-2"><Hash size={16}/> {loan.Employee?.code}</div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={16}/> {Number(loan.amount).toLocaleString()} EGP
                  </div>
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
                <ArrowLeft size={18} className={isAr ? "rotate-180" : ""} /> {isAr ? "رجوع" : "Back"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-8 lg:col-span-2">
            {/* Recipient Card */}
            <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600">
                    <User size={40} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{isAr ? "الموظف المستفيد" : "Beneficiary Employee"}</span>
                    <h2 className="text-2xl font-black text-slate-800">{loan.Employee?.full_name}</h2>
                    <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mt-2 inline-block border border-indigo-100">{loan.Employee?.code}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Details */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Coins size={16}/></div>
                        <h3 className="font-black text-slate-800 text-sm">{isAr ? "التفاصيل المالية" : "Financial Details"}</h3>
                    </div>
                    <div className="p-3">
                        <DataRow icon={CheckCircle2} label={isAr ? "المبلغ الإجمالي" : "Total Amount"} value={`${Number(loan.amount).toLocaleString()} EGP`} valueClass="text-emerald-600" />
                        <DataRow icon={CreditCard} label={isAr ? "مبلغ القسط" : "Installment Amount"} value={`${Number(loan.installment_amount).toLocaleString()} EGP`} />
                        <DataRow icon={Calendar} label={isAr ? "تاريخ المنح" : "Grant Date"} value={new Date(loan.grant_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')} />
                    </div>
                </div>

                {/* Audit Log */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-white"><Clock size={16}/></div>
                        <h3 className="font-black text-slate-800 text-sm">{isAr ? "سجل النظام" : "Audit Log"}</h3>
                    </div>
                    <div className="p-3">
                        <DataRow icon={Calendar} label={isAr ? "أنشئ في" : "Created At"} value={new Date(loan.createdAt || "").toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                        <DataRow icon={History} label={isAr ? "آخر تحديث" : "Updated At"} value={new Date(loan.updatedAt || "").toLocaleString()} />
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
              {/* Payment Status Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><TrendingUp size={18}/></div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{isAr ? "حالة السداد" : "Payment Status"}</h3>
                  </div>
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{isAr ? "المبلغ المدفوع" : "Paid Amount"}</p>
                          <p className="text-xl font-black text-emerald-600">{Number(loan.paid_amount).toLocaleString()} EGP</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{isAr ? "المبلغ المتبقي" : "Remaining Amount"}</p>
                          <p className="text-xl font-black text-rose-600">{remaining.toLocaleString()} EGP</p>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-slate-500">{isAr ? "نسبة السداد" : "Payment Progress"}</span>
                          <span className="text-indigo-600">{Math.round((Number(loan.paid_amount) / Number(loan.amount)) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(Number(loan.paid_amount) / Number(loan.amount)) * 100}%` }}></div>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Approval Status & Actions */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {isAr ? "حالة الاعتماد" : "Approval Status"}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded text-sm font-bold ${
                      statusColors[loan.approval_status || "pending"] || statusColors.pending
                    }`}
                  >
                    {loan.approval_status === "pending"
                      ? isAr
                        ? "معلّق"
                        : "Pending"
                      : loan.approval_status === "approved"
                        ? isAr
                          ? "معتمد"
                          : "Approved"
                        : isAr
                          ? "مرفوض"
                          : "Rejected"}
                  </span>
                </div>

                {loan.approval_status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleApprove}
                      disabled={approvalLoading}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm font-bold"
                    >
                      ✅ {isAr ? "اعتماد" : "Approve"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={approvalLoading}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-sm font-bold"
                    >
                      ❌ {isAr ? "رفض" : "Reject"}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl ${remaining <= 0 ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
                  <div className="relative z-10">
                      <CheckCircle2 size={32} className="mb-6 opacity-80" />
                      <h3 className="text-xl font-black mb-1">{isAr ? "حالة الرصيد" : "Balance Status"}</h3>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-8">
                        {remaining <= 0 ? (isAr ? "تم السداد بالكامل" : "Fully Paid") : (isAr ? "يوجد رصيد مستحق" : "Outstanding Balance")}
                      </p>
                      
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold opacity-70 mb-1">{isAr ? "القيمة" : "Value"}</p>
                          <div className="flex items-center gap-3">
                              <Receipt size={16} />
                              <span className="text-sm font-black">{remaining <= 0 ? '0' : remaining.toLocaleString()} EGP</span>
                          </div>
                      </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10">
                      <Banknote size={160} />
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAr ? "تعديل بيانات المعاملة" : "Edit Record Details"}>
        <div className="max-h-[75vh] overflow-y-auto px-1">
          <DynamicForm key={loan.id} fields={fields} onSubmit={handleSubmit}>
            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label={isAr ? "تحديث البيانات" : "Update Record"} />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
