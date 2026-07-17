"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Coins, ArrowLeft, Building2, User, 
  Clock, Wallet, FileText, Briefcase, Tags, Hash, History,
  Info, ShieldCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { RoleGuard } from "@/components/shared";
import { contractAllowanceService } from "../service";
import { contractService, allowanceTypeService } from "@/lib/services";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

export default function ContractAllowanceDetailsPage() {
  const t = useTranslations("contracts");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [allowance, setAllowance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<{
    contracts: { label: string; value: string | number }[];
    allowanceTypes: { label: string; value: string | number }[];
  }>({
    contracts: [],
    allowanceTypes: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await contractAllowanceService.getById(id);
      setAllowance(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError("Failed to fetch contract allowance details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isValidId]);

  const fetchOptions = useCallback(async () => {
      try {
        const [contractsRes, typesRes] = await Promise.all([
          contractService.getAll({ limit: 1000 }),
          allowanceTypeService.getAll({ limit: 1000 })
        ]);

        setOptions({
          contracts: contractsRes.data.map((c: any) => ({ 
            label: `${c.Employee?.full_name} - ${c.job_title}`, 
            value: c.id 
          })),
          allowanceTypes: typesRes.data.map((t: any) => ({ 
            label: t.name, 
            value: t.id 
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
      await contractAllowanceService.update(id, formData);
      notify.success(isAr ? "تم تحديث البدل بنجاح" : "Allowance updated successfully");

      setFormSuccess(isAr ? "تم تحديث البدل بنجاح" : "Allowance updated successfully");
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

  if (!allowance) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  
  const fields = [
    { name: "contract_id", label: "العقد / الموظف", type: "searchable-select", options: options.contracts, required: true },
    { name: "allowance_type_id", label: "نوع البدل", type: "searchable-select", options: options.allowanceTypes, required: true },
  ].map((f: any) => ({ ...f, defaultValue: allowance[f.name] }));

  const DataRow = ({ label, value, icon: Icon, valueClass = "text-slate-800" }: any) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white shadow-sm rounded-lg text-slate-400 group-hover:text-amber-600 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-sm font-black ${valueClass}`}>{value || "—"}</span>
    </div>
  );

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 p-10 text-white relative">
          <div className="absolute right-0 bottom-0 p-10 opacity-10">
            <Coins size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
                <Tags size={48} className="text-amber-100" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tight">{allowance.Allowance?.name || "بدل مخصص"}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-amber-100 font-bold text-sm">
                  <div className="flex items-center gap-2"><Wallet size={16}/> {Number(allowance.amount).toLocaleString()} EGP</div>
                  <div className="flex items-center gap-2"><FileText size={16}/> {allowance.EmployeeContract?.job_title}</div>
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
          {/* Allowance Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white"><Coins size={16}/></div>
                    <h3 className="font-black text-amber-800 text-sm">{isAr ? "تفاصيل التخصيص" : "Allowance Assignment"}</h3>
                </div>
                <div className="p-3">
                    <DataRow icon={Wallet} label={isAr ? "المبلغ المخصص (للعقد)" : "Assigned Amount"} value={`${Number(allowance.amount).toLocaleString()} EGP`} valueClass="text-emerald-600 font-black text-lg" />
                    <DataRow icon={Coins} label={isAr ? "المبلغ الافتراضي (للبدل)" : "Default Amount"} value={`${Number(allowance.Allowance?.default_amount).toLocaleString()} EGP`} />
                    <DataRow icon={ShieldCheck} label={isAr ? "جزء من الراتب" : "Part of Salary"} value={allowance.Allowance?.is_part_of_salary ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")} valueClass={allowance.Allowance?.is_part_of_salary ? "text-emerald-600" : "text-slate-500"} />
                    <DataRow icon={Hash} label={isAr ? "كود الحساب" : "Account Code"} value={allowance.Allowance?.account_code || "—"} />
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
                    <button onClick={() => router.push(`/contracts/${allowance.contract_id}`)} className="text-xs font-bold text-indigo-600 bg-indigo-100/50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        {isAr ? "عرض العقد" : "View Contract"}
                    </button>
                </div>
                <div className="p-3">
                    <DataRow icon={Briefcase} label={isAr ? "المسمى الوظيفي" : "Job Title"} value={allowance.EmployeeContract?.job_title} />
                    <DataRow icon={Wallet} label={isAr ? "الراتب الأساسي" : "Base Salary"} value={`${Number(allowance.EmployeeContract?.base_salary).toLocaleString()} EGP`} />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <History size={20} className="text-slate-600"/> 
                    <h3 className="font-black text-slate-800 text-sm">{isAr ? "سجل النظام" : "System Audit"}</h3>
                </div>
                <div className="p-3">
                    <DataRow icon={Clock} label={isAr ? "تاريخ التخصيص" : "Created At"} value={new Date(allowance.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                    <DataRow icon={Clock} label={isAr ? "وقت التحديث" : "Updated At"} value={new Date(allowance.updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAr ? "تعديل بيانات البدل" : "Edit Allowance Details"}>
        <div className="max-h-[75vh] overflow-y-auto px-1">
          <DynamicForm 
            fields={fields} 
            onSubmit={handleFormSubmit}
            error={formError}
            success={formSuccess}
          >
            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label={isAr ? "تحديث البيانات" : "Update Allowance"} />
            </div>
          </DynamicForm>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
