"use client";

import { notify } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  User, ArrowLeft, Calendar, Phone, Mail, MapPin, 
  Briefcase, GraduationCap, Building2, CreditCard, 
  FileText, Users, Gift, Landmark, Clock, ChevronRight,
  AlertCircle, TrendingDown, Edit3, Plus, ShieldCheck,
  Trash2, Banknote, History, Palmtree, KeyRound, X
} from "lucide-react";
import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
import EditButton from "@/components/ui/EditButton";
import SaveButton from "@/components/ui/SaveButton";
import { employeeService } from "../service";
import {
  employeeRelativeService,
  employeeExperienceService,
  employeeLoanService,
  employeeBonusService,
  absenceService,
  leaveRequestService,
  employeeDocumentService,
  bonusTypeService,
  absenceTypeService,
  leaveTypeService,
} from "@/lib/services";
import { ConfirmDialog, RoleGuard } from "@/components/shared";
import { can } from "@/lib/permissions";
import { getUser } from "@/lib/auth";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });
const DynamicForm = dynamic(() => import("@/components/ui/DynamicForm"), { ssr: false });

const CollapsibleSection = ({ title, icon: Icon, colorClass, onAdd, children, isAr, count }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section className="space-y-4">
      <div 
        className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={colorClass} />
          <h3 className="font-bold text-slate-800">{title} <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">{count}</span></h3>
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
             <button 
               onClick={(e) => { e.stopPropagation(); onAdd(); }} 
               className={`p-2 rounded-xl transition-all shadow-sm bg-slate-50 hover:bg-slate-100 text-slate-600`}
             >
               <Plus size={18}/>
             </button>
          )}
          <ChevronRight size={20} className={`text-slate-400 transition-transform ${isOpen ? "rotate-90" : isAr ? "rotate-180" : ""}`} />
        </div>
      </div>
      {isOpen && (
        <div className="grid gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          {children}
        </div>
      )}
    </section>
  );
};

export default function EmployeeDetailsPage() {
  const t = useTranslations("employees");
  const tBonus = useTranslations("bonuses");
  const tAbsence = useTranslations("absences");
  const params = useParams();
  const router = useRouter();
  const isAr = params?.locale === "ar";
  const rawId = params?.id;
  const id = Number(rawId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [employee, setEmployee] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ password: string; email: string } | null>(null);
  const currentUser = getUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Options for selects
  const [bonusTypes, setBonusTypes] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeType, setActiveType] = useState("");
  const [editRecordId, setEditRecordId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await employeeService.getById(id);
      setEmployee(data);
    } catch (err: any) {
      notify.handleApiError(err as { message?: string });
      setError("Failed to fetch employee details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isValidId]);

  const fetchOptions = useCallback(async () => {
      try {
          const [bonusesRes, absencesRes, leavesRes] = await Promise.all([
              bonusTypeService.getAll({ limit: 1000 }),
              absenceTypeService.getAll({ limit: 1000 }),
              leaveTypeService.getAll({ limit: 1000 }).catch(() => ({ data: [] })),
          ]);
          setBonusTypes(bonusesRes.data.map((b) => ({ label: b.name, value: b.id })));
          setAbsenceTypes(absencesRes.data.map((a) => ({ label: a.name, value: a.id })));
          setLeaveTypes(leavesRes.data.map((l) => ({ label: l.name, value: l.id })));
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

  const openModal = (type: string, data?: any) => {
    let fields: any[] = [];
    let title = "";
    
    setFormError(null);
    setFormSuccess(null);
    setActiveType(type);
    setEditRecordId(data?.id ?? null);

    switch (type) {
      case "personal":
        title = isAr ? "تعديل البيانات الشخصية" : "Edit Personal Info";
        fields = [
          { name: "full_name", label: t('form.fullName'), type: "text", defaultValue: employee.full_name, required: true },
          { name: "national_id", label: t('form.nationalId'), type: "text", defaultValue: employee.national_id, required: true },
          { name: "birth_date", label: t('form.birthDate'), type: "date", defaultValue: employee.birth_date },
          { name: "gender", label: t('form.gender'), type: "select", options: [{label: isAr ? "ذكر" : "Male", value: "M"}, {label: isAr ? "أنثى" : "Female", value: "F"}], defaultValue: employee.gender },
          { name: "phone_number", label: t('form.phone'), type: "text", defaultValue: employee.phone_number },
          { name: "email", label: t('form.email'), type: "text", defaultValue: employee.email },
          { name: "address", label: t('form.address'), type: "text", defaultValue: employee.address },
          { name: "marital_status", label: t('form.maritalStatus'), type: "select", options: [{label: isAr ? "أعزب" : "Single", value: "single"}, {label: isAr ? "متزوج" : "Married", value: "married"}], defaultValue: employee.marital_status },
        ];
        break;
      case "bank":
        title = isAr ? "تعديل البيانات البنكية والتعليم" : "Edit Bank & Education";
        fields = [
          { name: "qualification", label: t('form.qualification'), type: "text", defaultValue: employee.qualification },
          { name: "bank_name", label: t('form.bankName'), type: "text", defaultValue: employee.bank_name },
          { name: "bank_account", label: t('form.bankAccount'), type: "text", defaultValue: employee.bank_account },
        ];
        break;
      case "relative":
        title = data ? (isAr ? "تعديل قريب" : "Edit Relative") : (isAr ? "إضافة قريب" : "Add Relative");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "name", label: isAr ? "الاسم" : "Name", type: "text", defaultValue: data?.name, required: true },
          { name: "relation", label: isAr ? "الصلة" : "Relation", type: "text", defaultValue: data?.relation },
          { name: "phone", label: isAr ? "الهاتف" : "Phone", type: "text", defaultValue: data?.phone },
        ];
        break;
      case "experience":
        title = data ? (isAr ? "تعديل خبرة" : "Edit Experience") : (isAr ? "إضافة خبرة" : "Add Experience");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "company_name", label: isAr ? "الشركة" : "Company", type: "text", defaultValue: data?.company_name, required: true },
          { name: "from_date", label: isAr ? "من تاريخ" : "From", type: "date", defaultValue: data?.from_date },
          { name: "to_date", label: isAr ? "إلى تاريخ" : "To", type: "date", defaultValue: data?.to_date },
        ];
        break;
      case "loan":
        title = data ? (isAr ? "تعديل سلفة" : "Edit Loan") : (isAr ? "إضافة سلفة" : "Add Loan");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "amount", label: isAr ? "المبلغ" : "Amount", type: "number", defaultValue: data?.amount, required: true },
          { name: "grant_date", label: isAr ? "تاريخ المنح" : "Grant Date", type: "date", defaultValue: data?.grant_date },
          { name: "installment_amount", label: isAr ? "مبلغ القسط" : "Installment", type: "number", defaultValue: data?.installment_amount },
          { name: "status", label: isAr ? "الحالة" : "Status", type: "select", options: [{label: "Active", value: "active"}, {label: "Paid", value: "paid"}], defaultValue: data?.status || "active" },
        ];
        break;
      case "bonus":
        title = data ? (isAr ? "تعديل مكافأة" : "Edit Bonus") : (isAr ? "إضافة مكافأة" : "Add Bonus");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "bonus_type_id", label: isAr ? "نوع المكافأة" : "Bonus Type", type: "select", options: bonusTypes, defaultValue: data?.bonus_type_id, required: true },
          { name: "amount", label: isAr ? "المبلغ" : "Amount", type: "number", defaultValue: data?.amount, required: true },
          { name: "grant_date", label: isAr ? "تاريخ المنح" : "Grant Date", type: "date", defaultValue: data?.grant_date },
        ];
        break;
      case "absence":
        title = data ? (isAr ? "تعديل غياب" : "Edit Absence") : (isAr ? "إضافة غياب" : "Add Absence");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "absence_type_id", label: isAr ? "نوع الغياب" : "Absence Type", type: "select", options: absenceTypes, defaultValue: data?.absence_type_id, required: true },
          { name: "absence_date", label: isAr ? "تاريخ الغياب" : "Absence Date", type: "date", defaultValue: data?.absence_date, required: true },
          { name: "deduction_days", label: isAr ? "أيام الخصم" : "Deduction Days", type: "number", defaultValue: data?.deduction_days },
        ];
        break;
      case "leave":
        title = data ? (isAr ? "تعديل حالة الإجازة" : "Edit Leave State") : (isAr ? "إضافة إجازة" : "Add Leave");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "leave_type_id", label: isAr ? "نوع الإجازة" : "Leave Type", type: "select", options: leaveTypes, defaultValue: data?.leave_type_id, required: true, disabled: !!data },
          { name: "start_date", label: isAr ? "من تاريخ" : "Start Date", type: "date", defaultValue: data?.start_date, required: true, disabled: !!data },
          { name: "end_date", label: isAr ? "إلى تاريخ" : "End Date", type: "date", defaultValue: data?.end_date, required: true, disabled: !!data },
          { name: "status", label: isAr ? "الحالة" : "Status", type: "select", options: [{label: "Pending", value: "pending"}, {label: "Approved", value: "approved"}, {label: "Rejected", value: "rejected"}], defaultValue: data?.status || "pending" },
          { name: "reason", label: isAr ? "السبب (مطلوب عند الرفض)" : "Reason (if rejected)", type: "text", defaultValue: data?.reason },
        ];
        break;
      case "document":
        title = data ? (isAr ? "تعديل مستند" : "Edit Document") : (isAr ? "إضافة مستند" : "Add Document");
        fields = [
          { name: "employee_id", type: "hidden", defaultValue: id },
          { name: "doc_name", label: isAr ? "اسم المستند" : "Document Name", type: "text", defaultValue: data?.doc_name, required: true },
          { name: "file_path", label: isAr ? "رابط الملف" : "File URL", type: "text", defaultValue: data?.file_path, required: true },
          { name: "uploaded_at", label: isAr ? "تاريخ الرفع" : "Upload Date", type: "date", defaultValue: data?.uploaded_at || new Date().toISOString().split('T')[0] },
        ];
        break;
    }

    setFormFields(fields);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const handleDelete = (type: string, subId: number) => {
    setDeleteConfirm({ type, id: subId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const { type, id: subId } = deleteConfirm;
      if (type === "relative") await employeeRelativeService.delete(subId);
      if (type === "experience") await employeeExperienceService.delete(subId);
      if (type === "loan") await employeeLoanService.delete(subId);
      if (type === "bonus") await employeeBonusService.delete(subId);
      if (type === "absence") await absenceService.delete(subId);
      if (type === "leave") await leaveRequestService.delete(subId);
      if (type === "document") await employeeDocumentService.delete(subId);
      notify.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
      fetchData();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      if (activeType === "personal" || activeType === "bank") {
        await employeeService.update(id, formData);
      } else if (activeType === "relative") {
        if (editRecordId) await employeeRelativeService.update(editRecordId, formData);
        else await employeeRelativeService.create(formData);
      } else if (activeType === "experience") {
        if (editRecordId) await employeeExperienceService.update(editRecordId, formData);
        else await employeeExperienceService.create(formData);
      } else if (activeType === "loan") {
        if (editRecordId) await employeeLoanService.update(editRecordId, formData);
        else await employeeLoanService.create(formData);
      } else if (activeType === "bonus") {
        if (editRecordId) await employeeBonusService.update(editRecordId, formData);
        else await employeeBonusService.create(formData);
      } else if (activeType === "absence") {
        if (editRecordId) await absenceService.update(editRecordId, formData);
        else await absenceService.create(formData);
      } else if (activeType === "leave") {
        if (editRecordId) await leaveRequestService.update(editRecordId, formData);
        else await leaveRequestService.create(formData);
      } else if (activeType === "document") {
        if (editRecordId) await employeeDocumentService.update(editRecordId, formData);
        else await employeeDocumentService.create(formData);
      }
      
      notify.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
      setFormSuccess(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
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

  if (!employee) {
    return (
      <RoleGuard permission="read:employees">
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold">لا توجد بيانات</div>
      </div>
      </RoleGuard>
    );
  }

  
  const DataRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white shadow-sm rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-800">{value || "—"}</span>
    </div>
  );

  return (
    <RoleGuard permission="read:employees">
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 text-white">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{employee.full_name}</h1>
                <p className="text-indigo-100/80 text-sm font-medium">#{employee.code} | {employee.qualification}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && can(currentUser.role, "manage:employees") && (
                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={async () => {
                    setResetLoading(true);
                    try {
                      const res = await employeeService.resetUserPassword(id).catch(async () => {
                        return employeeService.createUserAccount(id);
                      });
                      setResetResult({
                        password: res.password,
                        email: res.user.email,
                      });
                    } catch (err) {
                      notify.handleApiError(err as { message?: string });
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <KeyRound size={16} />
                  {isAr ? "حساب الدخول" : "Login Account"}
                </button>
              )}
              <EditButton 
                onClick={() => openModal("personal")} 
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white w-9 h-9" 
              />
              <button onClick={() => router.back()} className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2">
                <ArrowLeft size={16} className={isAr ? "rotate-180" : ""} /> {isAr ? "الرجوع" : "Back"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><User size={16}/> {isAr ? "البيانات الشخصية" : "Personal"}</h3>
              <EditButton onClick={() => openModal("personal")} className="w-7 h-7" />
            </div>
            <div className="p-2">
              <DataRow icon={CreditCard} label={isAr ? "الرقم القومي" : "National ID"} value={employee.national_id} />
              <DataRow icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={employee.phone_number} />
              <DataRow icon={Mail} label={isAr ? "الإيميل" : "Email"} value={employee.email} />
              <DataRow icon={MapPin} label={isAr ? "العنوان" : "Address"} value={employee.address} />
              <DataRow icon={Calendar} label={isAr ? "الميلاد" : "Birth"} value={employee.birth_date} />
              <DataRow icon={User} label={isAr ? "الجنس" : "Gender"} value={employee.gender === 'M' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')} />
              <DataRow icon={Users} label={isAr ? "الحالة الاجتماعية" : "Marital Status"} value={employee.marital_status} />
            </div>
          </div>

          {/* Bank & Professional Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Building2 size={16}/> {isAr ? "العمل والبنك" : "Job & Bank"}</h3>
              <EditButton onClick={() => openModal("bank")} className="w-7 h-7" />
            </div>
            <div className="p-2">
              <DataRow icon={GraduationCap} label={isAr ? "المؤهل" : "Degree"} value={employee.qualification} />
              <DataRow icon={Building2} label={isAr ? "البنك" : "Bank"} value={employee.bank_name} />
              <DataRow icon={CreditCard} label={isAr ? "الحساب" : "Account"} value={employee.bank_account} />
              <DataRow icon={ShieldCheck} label={isAr ? "القسم" : "Department"} value={employee.Department?.name || (isAr ? "غير محدد" : "N/A")} />
              <DataRow icon={ShieldCheck} label={isAr ? "الحالة" : "Status"} value={employee.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")} />
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Clock size={16}/> {isAr ? "بيانات النظام" : "System Info"}</h3>
            </div>
            <div className="p-2">
              <DataRow icon={Clock} label={isAr ? "تاريخ الإنشاء" : "Created At"} value={new Date(employee.createdAt).toLocaleString()} />
              <DataRow icon={Clock} label={isAr ? "آخر تحديث" : "Updated At"} value={new Date(employee.updatedAt).toLocaleString()} />
              <DataRow icon={User} label={isAr ? "بواسطة" : "Created By"} value={employee.created_by} />
            </div>
          </div>
        </div>

        {/* Dynamic Lists Sections */}
        <div className="p-8 space-y-6 border-t border-slate-100 bg-slate-50/20">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CollapsibleSection
              title={isAr ? "الأقارب" : "Relatives"}
              icon={Users}
              colorClass="text-indigo-600"
              count={employee.relatives?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("relative")}
            >
              {employee.relatives?.map((rel: any) => (
                <div key={rel.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{rel.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{rel.relation} | {rel.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <EditButton onClick={() => { openModal("relative", rel); }} className="w-6 h-6" />
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("relative", rel.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {(!employee.relatives || employee.relatives.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title={isAr ? "الخبرات السابقة" : "Experiences"}
              icon={Briefcase}
              colorClass="text-amber-600"
              count={employee.experiences?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("experience")}
            >
              {employee.experiences?.map((exp: any) => (
                <div key={exp.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-amber-200 hover:shadow-md transition-all group">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{exp.company_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{exp.from_date} - {exp.to_date}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <EditButton onClick={() => { openModal("experience", exp); }} className="w-6 h-6" />
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("experience", exp.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {(!employee.experiences || employee.experiences.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CollapsibleSection
              title={isAr ? "المكافآت" : "Bonuses"}
              icon={Gift}
              colorClass="text-indigo-600"
              count={employee.EmployeeBonus?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("bonus")}
            >
              {employee.EmployeeBonus?.map((bonus: any) => (
                <div key={bonus.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">{bonus.amount}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{new Date(bonus.grant_date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Type ID: {bonus.bonus_type_id} | {bonus.is_paid ? "Paid" : "Pending"}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <EditButton onClick={() => { openModal("bonus", bonus); }} className="w-6 h-6" />
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("bonus", bonus.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {(!employee.EmployeeBonus || employee.EmployeeBonus.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title={isAr ? "الغياب" : "Absences"}
              icon={TrendingDown}
              colorClass="text-rose-600"
              count={employee.EmployeeAbsences?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("absence")}
            >
              {employee.EmployeeAbsences?.map((abs: any) => (
                <div key={abs.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-rose-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-black text-xs shadow-sm">{abs.deduction_days}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{new Date(abs.absence_date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{abs.notes || "No notes"}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <EditButton onClick={() => { openModal("absence", abs); }} className="w-6 h-6" />
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("absence", abs.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {(!employee.EmployeeAbsences || employee.EmployeeAbsences.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CollapsibleSection
              title={isAr ? "الإجازات" : "Leave Requests"}
              icon={Palmtree}
              colorClass="text-teal-600"
              count={employee.LeaveRequests?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("leave")}
            >
              {employee.LeaveRequests?.map((leave: any) => {
                const isLeaveOld = new Date(leave.start_date) < new Date(new Date().setHours(0,0,0,0));
                return (
                <div key={leave.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-teal-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : leave.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        {leave.days_count}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                          <span className={leave.status === 'approved' ? 'text-emerald-500' : leave.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}>
                             {leave.status}
                          </span> 
                          {leave.reason ? ` | ${leave.reason}` : ""}
                        </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {!isLeaveOld && (
                      <EditButton onClick={() => { openModal("leave", leave); }} className="w-6 h-6" />
                    )}
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("leave", leave.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              )})}
              {(!employee.LeaveRequests || employee.LeaveRequests.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>
            
            <CollapsibleSection
              title={isAr ? "السلف" : "Loans"}
              icon={Banknote}
              colorClass="text-emerald-600"
              count={employee.EmployeeAdvanceLoans?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("loan")}
            >
              {employee.EmployeeAdvanceLoans?.map((loan: any) => (
                <div key={loan.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center hover:border-emerald-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs shadow-sm">{loan.amount}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{new Date(loan.grant_date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Installment: {loan.installment_amount} | Paid: {loan.paid_amount}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <EditButton onClick={() => { openModal("loan", loan); }} className="w-6 h-6" />
                    <button onClick={(e: any) => { e.stopPropagation(); handleDelete("loan", loan.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {(!employee.EmployeeAdvanceLoans || employee.EmployeeAdvanceLoans.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CollapsibleSection
              title={isAr ? "سجل الحضور" : "Attendance Log"}
              icon={History}
              colorClass="text-slate-600"
              count={employee.Attendances?.length || 0}
              isAr={isAr}
            >
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-[10px] text-start">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-100">
                          <tr>
                              <th className="p-3 text-start">Date</th>
                              <th className="p-3 text-start">In</th>
                              <th className="p-3 text-start">Out</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {employee.Attendances?.map((att: any) => (
                              <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 font-bold text-slate-700">{att.work_date}</td>
                                  <td className="p-3 text-indigo-600 font-black">{att.check_in || "—"}</td>
                                  <td className="p-3 text-rose-600 font-black">{att.check_out || "—"}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {(!employee.Attendances || employee.Attendances.length === 0) && (
                    <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-b-2xl">{isAr ? "لا يوجد بيانات" : "No data"}</div>
                  )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={isAr ? "المستندات" : "Documents"}
              icon={FileText}
              colorClass="text-slate-600"
              count={employee.documents?.length || 0}
              isAr={isAr}
              onAdd={() => openModal("document")}
            >
              <div className="grid grid-cols-1 gap-3">
                {employee.documents?.map((doc: any) => (
                  <div key={doc.id} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 truncate max-w-[150px]">{doc.doc_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {new Date(doc.uploaded_at || doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <EditButton onClick={() => { openModal("document", doc); }} className="w-6 h-6" />
                        <button onClick={(e: any) => { e.stopPropagation(); handleDelete("document", doc.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <a 
                        href={doc.file_path} 
                        target="_blank" 
                        className="text-[11px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAr ? "عرض الملف" : "View File"} <ChevronRight size={14} className={isAr ? "rotate-180" : ""} />
                      </a>
                      <span className="text-[9px] text-slate-300 font-medium">ID: {doc.id}</span>
                    </div>
                  </div>
                ))}
              </div>
              {(!employee.documents || employee.documents.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">{isAr ? "لا يوجد بيانات" : "No data"}</div>
              )}
            </CollapsibleSection>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
               <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <Gift className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-black opacity-70 uppercase tracking-widest mb-1">{isAr ? "إجمالي المكافآت" : "Total Bonus"}</div>
                  <div className="text-3xl font-black">{employee.EmployeeBonus?.reduce((acc: any, b: any) => acc + parseFloat(b.amount), 0) || 0} <span className="text-sm opacity-60">EGP</span></div>
                  <div className="mt-6 flex items-center gap-2">
                      <div className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Count: {employee.EmployeeBonus?.length || 0}</div>
                      <div className="text-[10px] font-black bg-emerald-400/30 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/20">Verified</div>
                  </div>
               </div>
               <div className="p-6 rounded-3xl bg-slate-800 text-white shadow-xl shadow-slate-100 relative overflow-hidden group">
                  <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-black opacity-70 uppercase tracking-widest mb-1">{isAr ? "السلف النشطة" : "Active Loans"}</div>
                  <div className="text-3xl font-black">{employee.EmployeeAdvanceLoans?.reduce((acc: any, l: any) => acc + (l.status === 'active' ? parseFloat(l.amount) : 0), 0) || 0} <span className="text-sm opacity-60">EGP</span></div>
                  <div className="mt-6 flex items-center gap-2">
                      <div className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Count: {employee.EmployeeAdvanceLoans?.filter((l:any) => l.status === 'active').length || 0}</div>
                      <div className="text-[10px] font-black bg-amber-400/30 text-amber-50 px-3 py-1 rounded-full border border-amber-400/20">Action Required</div>
                  </div>
               </div>
          </div>

        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <DynamicForm 
            fields={formFields} 
            onSubmit={handleFormSubmit}
            key={modalTitle}
              error={formError}
            success={formSuccess}
          >
            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <SaveButton isSubmitting={isSubmitting} label={editRecordId ? t('buttons.update') : t('buttons.add')} />
            </div>
          </DynamicForm>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title={isAr ? "تأكيد الحذف" : "Confirm delete"}
        description={isAr ? "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete? This action cannot be undone."}
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {isAr ? "كلمة المرور الجديدة" : "New Password"}
              </h3>
              <button type="button" onClick={() => setResetResult(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <p><span className="text-slate-500">{isAr ? "البريد:" : "Email:"}</span> <strong>{resetResult.email}</strong></p>
              <p className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                <KeyRound className="h-4 w-4" />
                {resetResult.password}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}

// Dummy Component for Missing Icon
function IdentificationCard({ size, className }: any) {
  return <CreditCard size={size} className={className} />;
}