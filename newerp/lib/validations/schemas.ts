/**
 * Zod validation schemas for all ERP modules.
 * Derived from erb/openapi.yaml component schemas & request bodies.
 */
import { z } from "zod";

// ─── Shared primitives ───────────────────────────────────────────────────────

export const idField = z.coerce.number().min(1, "المعرّف مطلوب");

export const optionalIdField = z
  .union([z.coerce.number(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)));

export const dateField = z.string().min(1, "التاريخ مطلوب");

export const dateFieldOptional = z.string().optional().nullable();

export const amountField = z.coerce.number().min(0, "المبلغ لا يمكن أن يكون سالباً");

export const positiveAmount = z.coerce
  .number()
  .positive("المبلغ يجب أن يكون أكبر من صفر");

export const egyptPhone = z
  .string()
  .regex(/^01[0-9]{9}$/, "رقم هاتف مصري غير صحيح");

export const egyptPhoneOptional = egyptPhone.optional().or(z.literal(""));

export const nationalId = z.string().length(14, "رقم الهوية 14 رقم");

export const emailOptional = z
  .string()
  .email("بريد إلكتروني غير صحيح")
  .optional()
  .or(z.literal(""));

export const optionalNotes = z.string().optional().nullable();

const checkboxBool = z
  .union([z.boolean(), z.literal("on"), z.literal("off")])
  .optional()
  .transform((v) => v === true || v === "on");

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, "اسم المستخدم أو البريد مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة").min(6, "كلمة المرور 6 أحرف على الأقل"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
});

export const verifyResetCodeSchema = z.object({
  code: z.string().min(4, "رمز التحقق مطلوب"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
    confirmPassword: z.string().min(6, "يرجى تأكيد كلمة المرور"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة 6 أحرف على الأقل"),
    confirmPassword: z.string().min(6, "يرجى تأكيد كلمة المرور"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

// ─── Users ───────────────────────────────────────────────────────────────────

export const userRoleEnum = z.enum(["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"]);

export const userCreateSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب (3 أحرف على الأقل)"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phoneNumber: egyptPhone,
  role: z.enum(["ADMIN", "HR", "ACCOUNTING"], { message: "الدور مطلوب" }),
  isActive: z.coerce.boolean().optional().default(true),
});

export const userUpdateSchema = userCreateSchema.partial().extend({
  role: userRoleEnum.optional(),
  isBlock: z.coerce.boolean().optional(),
});

export const userSchema = userCreateSchema;

// ─── Settings / Master data ──────────────────────────────────────────────────

export const departmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  type: z.string().min(1, "نوع القسم مطلوب"),
  parent_id: optionalIdField,
});

export const shiftSchema = z.object({
  name: z.string().min(1, "اسم الوردية مطلوب"),
  type: z.enum(["morning", "evening", "between"], { message: "نوع الوردية مطلوب" }),
  work_days: z.string().min(1, "أيام العمل مطلوبة"),
  start_time: z.string().min(1, "وقت البداية مطلوب"),
  end_time: z.string().min(1, "وقت النهاية مطلوب"),
  grace_minutes: z.coerce.number().min(0, "دقائق السماح لا يمكن أن تكون سالبة"),
  deduct_grace: z.coerce.boolean().optional(),
  salary_basis_days: z.coerce.number().min(1, "أيام أساس الراتب مطلوبة"),
});

export const leaveTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع الإجازة مطلوب"),
  annual_balance: z.coerce.number().min(0, "الرصيد السنوي لا يمكن أن يكون سالباً"),
  affects_deduction: z.coerce.boolean({ message: "حقل الخصم مطلوب" }),
});

export const officialHolidaySchema = z.object({
  name: z.string().min(1, "اسم العطلة مطلوب"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح (YYYY-MM-DD)"),
  days_count: z.coerce.number().min(1, "عدد الأيام يجب أن يكون 1 على الأقل"),
});

export const accountTypeEnum = z.enum(["asset", "liability", "equity", "revenue", "expense"]);

export const accountSchema = z.object({
  name: z.string().min(1, "اسم الحساب مطلوب"),
  code: z.string().min(1, "كود الحساب مطلوب"),
  type: accountTypeEnum,
  parent_id: optionalIdField,
  description: optionalNotes,
  currency: z.string().min(1, "العملة مطلوبة").default("EGP"),
});

export const allowanceTypeSchema = z.object({
  name: z.string().min(1, "اسم البدل مطلوب"),
  default_amount: amountField,
  is_part_of_salary: z.coerce.boolean(),
  account_code: z.string().min(1, "كود الحساب مطلوب"),
});

export const absenceTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع الغياب مطلوب"),
  deduct_days: z.coerce.number().min(0, "أيام الخصم لا يمكن أن تكون سالبة"),
  requires_permission: z.coerce.boolean().optional(),
});

export const bonusTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع المكافأة مطلوب"),
  payment_type: z.enum(["cash", "deferred"], { message: "نوع الدفع مطلوب" }),
  default_amount: z.coerce.number().nullable().optional(),
  editable_amount: z.coerce.boolean().optional(),
});

export const insuranceSettingSchema = z.object({
  employee_rate: z.coerce.number().min(0, "نسبة الموظف لا يمكن أن تكون سالبة"),
  company_rate: z.coerce.number().min(0, "نسبة الشركة لا يمكن أن تكون سالبة"),
  effective_from: dateField,
});

/** @deprecated use insuranceSettingSchema */
export const insuranceSchema = insuranceSettingSchema;

// ─── Employees & related ─────────────────────────────────────────────────────

export const employeeSchema = z.object({
  code: z.string().min(1, "كود الموظف مطلوب"),
  full_name: z.string().min(3, "الاسم مطلوب (3 أحرف على الأقل)"),
  birth_date: dateField,
  gender: z.enum(["M", "F"], { message: "الجنس مطلوب" }),
  national_id: nationalId,
  phone_number: egyptPhoneOptional,
  phone: egyptPhoneOptional,
  email: emailOptional,
  address: z.string().optional().nullable(),
  marital_status: z
    .enum(["single", "married", "divorced", "widowed"])
    .optional(),
  qualification: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
});

export const employeeDocumentSchema = z.object({
  employee_id: idField,
  doc_name: z.string().min(1, "اسم المستند مطلوب"),
  file_path: z.string().min(1, "مسار الملف مطلوب"),
  uploaded_at: dateFieldOptional,
});

export const employeeRelativeSchema = z.object({
  employee_id: idField,
  name: z.string().min(1, "اسم القريب مطلوب"),
  relation: z.string().min(1, "صلة القرابة مطلوبة"),
  phone: egyptPhone,
});

export const employeeExperienceSchema = z.object({
  employee_id: idField,
  company_name: z.string().min(1, "اسم الشركة مطلوب"),
  position: z.string().min(1, "المسمى الوظيفي مطلوب"),
  from_date: dateField,
  to_date: dateFieldOptional,
});

// ─── Contracts ─────────────────────────────────────────────────────────────────

export const contractStatusEnum = z.enum([
  "active",
  "suspended",
  "resigned",
  "dismissed",
]);

export const contractSchema = z.object({
  employee_id: idField,
  department_id: idField,
  shift_id: idField,
  job_title: z.string().min(1, "المسمى الوظيفي مطلوب"),
  start_date: dateField,
  end_date: dateFieldOptional,
  duration_years: z.coerce.number().min(0).optional().nullable(),
  base_salary: positiveAmount,
  status: contractStatusEnum.default("active"),
  overtime_enabled: checkboxBool,
  notes: optionalNotes,
  attachment: z.string().optional().nullable(),
  insurance_setting_id: optionalIdField,
});

export const contractAllowanceSchema = z.object({
  contract_id: idField,
  allowance_type_id: idField,
  amount: amountField,
});

export const contractLeaveSchema = z.object({
  contract_id: idField,
  leave_type_id: idField,
  used_days: z.coerce.number().min(0, "الأيام المستخدمة لا يمكن أن تكون سالبة"),
  year: z.coerce.number().min(2000).max(2100, "السنة غير صالحة"),
});

// ─── Custody ─────────────────────────────────────────────────────────────────

export const custodySchema = z.object({
  item_name: z.string().min(1, "اسم العهدة مطلوب"),
  from_employee_id: optionalIdField,
  to_employee_id: idField,
  transfer_type: z.enum(["handover", "receive", "transfer"], {
    message: "نوع التحويل مطلوب",
  }),
  transfer_date: dateField,
  notes: optionalNotes,
});

// ─── Loans & Bonuses ─────────────────────────────────────────────────────────

export const employeeLoanSchema = z.object({
  employee_id: idField,
  type: z.enum(["loan", "advance"], { message: "نوع المعاملة مطلوب" }),
  amount: positiveAmount,
  grant_date: dateField,
  installment_amount: z.coerce.number().min(0).optional().nullable(),
  paid_amount: z.coerce.number().min(0).optional(),
  status: z.enum(["active", "settled"]).default("active"),
});

export const employeeLoanApprovalSchema = z.object({
  approval_status: z.enum(["pending", "approved", "rejected"]),
  rejection_reason: z.string().optional().nullable(),
});

export const employeeBonusSchema = z.object({
  employee_id: idField,
  bonus_type_id: idField,
  amount: positiveAmount,
  grant_date: dateField,
  is_paid: checkboxBool,
  payment_month: z.coerce.number().min(1).max(12).optional().nullable(),
  payment_year: z.coerce.number().min(2000).max(2100).optional().nullable(),
});

export const employeeBonusApprovalSchema = z.object({
  approval_status: z.enum(["pending", "approved", "rejected"]),
  rejection_reason: z.string().optional().nullable(),
});

// ─── Absences & Leaves ───────────────────────────────────────────────────────

export const absenceSchema = z.object({
  employee_id: idField,
  absence_type_id: idField,
  absence_date: dateField,
  deduction_days: z.coerce.number().min(0, "أيام الخصم لا يمكن أن تكون سالبة"),
  notes: optionalNotes,
});

export const leaveRequestCreateSchema = z.object({
  employee_id: idField,
  leave_type_id: idField,
  start_date: dateField,
  end_date: dateField,
  days_count: z.coerce.number().min(1, "عدد الأيام مطلوب"),
});

export const leaveRequestEditSchema = leaveRequestCreateSchema.extend({
  status: z.enum(["pending", "approved", "rejected"]),
  reason: optionalNotes,
});

export const leaveRequestSchema = leaveRequestCreateSchema;

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceCheckSchema = z.object({
  employee_id: idField,
  work_date: dateField,
  check_in: z.string().optional(),
  check_out: z.string().optional(),
});

export const attendanceSchema = z.object({
  employee_id: idField,
  work_date: dateField,
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  late_hours: z.coerce.number().min(0).optional(),
  overtime_hours: z.coerce.number().min(0).optional(),
  notes: optionalNotes,
});

// ─── Payroll ─────────────────────────────────────────────────────────────────

export const payrollRunCreateSchema = z.object({
  month: z.coerce.number().min(1, "الشهر مطلوب").max(12),
  year: z.coerce.number().min(2000).max(2100, "السنة غير صالحة"),
  auto_process: z.coerce.boolean().optional(),
  status: z.enum(["draft", "confirmed", "paid"]).optional(),
});

export const payrollRunUpdateSchema = z.object({
  status: z.enum(["draft", "confirmed", "paid"]).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const payrollRunSchema = payrollRunCreateSchema;

// ─── Accounting ──────────────────────────────────────────────────────────────

export const journalLineSchema = z
  .object({
    account_id: idField,
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
    description: z.string().optional().nullable(),
    employee_id: optionalIdField,
    cost_center_id: optionalIdField,
  })
  .refine((line) => line.debit > 0 || line.credit > 0, {
    message: "يجب إدخال مدين أو دائن",
  })
  .refine((line) => !(line.debit > 0 && line.credit > 0), {
    message: "لا يمكن أن يكون السطر مديناً ودائناً معاً",
  });

export const journalEntryCreateSchema = z.object({
  entry_type: z.string().min(1, "نوع القيد مطلوب"),
  description: z.string().min(1, "وصف القيد مطلوب"),
  posting_date: dateField,
  payroll_run_id: optionalIdField,
  reference_type: z.string().optional().nullable(),
  reference_id: optionalIdField,
  status: z.enum(["draft", "posted", "cancelled"]).optional().default("posted"),
  lines: z.array(journalLineSchema).min(2, "القيد يحتاج سطرين على الأقل"),
});

export const accountingPeriodSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

export const accountingPeriodCloseSchema = z.object({
  status: z.literal("closed"),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof userCreateSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type ShiftFormData = z.infer<typeof shiftSchema>;
export type LeaveTypeFormData = z.infer<typeof leaveTypeSchema>;
export type OfficialHolidayFormData = z.infer<typeof officialHolidaySchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type AllowanceTypeFormData = z.infer<typeof allowanceTypeSchema>;
export type AbsenceTypeFormData = z.infer<typeof absenceTypeSchema>;
export type BonusTypeFormData = z.infer<typeof bonusTypeSchema>;
export type InsuranceSettingFormData = z.infer<typeof insuranceSettingSchema>;
export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type EmployeeDocumentFormData = z.infer<typeof employeeDocumentSchema>;
export type EmployeeRelativeFormData = z.infer<typeof employeeRelativeSchema>;
export type EmployeeExperienceFormData = z.infer<typeof employeeExperienceSchema>;
export type ContractFormData = z.infer<typeof contractSchema>;
export type ContractAllowanceFormData = z.infer<typeof contractAllowanceSchema>;
export type ContractLeaveFormData = z.infer<typeof contractLeaveSchema>;
export type CustodyFormData = z.infer<typeof custodySchema>;
export type EmployeeLoanFormData = z.infer<typeof employeeLoanSchema>;
export type EmployeeBonusFormData = z.infer<typeof employeeBonusSchema>;
export type AbsenceFormData = z.infer<typeof absenceSchema>;
export type LeaveRequestFormData = z.infer<typeof leaveRequestCreateSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
export type PayrollRunFormData = z.infer<typeof payrollRunCreateSchema>;
export type JournalEntryFormData = z.infer<typeof journalEntryCreateSchema>;
export type AccountingPeriodFormData = z.infer<typeof accountingPeriodSchema>;

/** Map of schema name → schema for dynamic lookup (e.g. code generators) */
export const schemaRegistry = {
  login: loginSchema,
  user: userCreateSchema,
  department: departmentSchema,
  shift: shiftSchema,
  leaveType: leaveTypeSchema,
  officialHoliday: officialHolidaySchema,
  account: accountSchema,
  allowanceType: allowanceTypeSchema,
  absenceType: absenceTypeSchema,
  bonusType: bonusTypeSchema,
  insuranceSetting: insuranceSettingSchema,
  employee: employeeSchema,
  employeeDocument: employeeDocumentSchema,
  employeeRelative: employeeRelativeSchema,
  employeeExperience: employeeExperienceSchema,
  contract: contractSchema,
  contractAllowance: contractAllowanceSchema,
  contractLeave: contractLeaveSchema,
  custody: custodySchema,
  employeeLoan: employeeLoanSchema,
  employeeBonus: employeeBonusSchema,
  absence: absenceSchema,
  leaveRequest: leaveRequestCreateSchema,
  leaveRequestEdit: leaveRequestEditSchema,
  attendance: attendanceSchema,
  attendanceCheck: attendanceCheckSchema,
  payrollRun: payrollRunCreateSchema,
  journalEntry: journalEntryCreateSchema,
  accountingPeriod: accountingPeriodSchema,
} as const;

export type SchemaRegistryKey = keyof typeof schemaRegistry;
