> **تاريخ التقرير:** 20 يونيو 2026  
> **الهدف:** مرجع سريع لحالة المشروع كاملاً (Backend: `erb/` · Frontend: `newerp/`)  
> **الحالة العامة:** الباك إند ~**95%** (API + محاسبة) · الفرونت ~**67%** (HR CRUD جاهز · Payroll/Accounting/Users ناقص) · **غير جاهز للإنتاج** — يحتاج seed + إصلاح bonus deferred + Payroll/Approval UI

---

## القسم 1 — ملخص تنفيذي (Executive Summary)

| البند | المخطط | المنفَّذ | النسبة |
|-------|--------|---------|--------|
| جداول قاعدة البيانات | 30 (28 أصلية + `accounting_periods` + `audit_logs`) | **30** | **100%** |
| الـ API Endpoints | 145 (138 أصلية + 7 جديدة) | **145** | **100%** |
| شاشات الفرونت | ~66 (44 موجودة + ~22 ناقصة) | **44** | **~67%** |
| الـ Components | ~20 (م reusable UI + auth + layout) | **15** | **~75%** |
| Seed Data | 25 جدول (بيانات تجريبية) | **1 جدول** (`users` فقط) | **~4%** |
| Tests | تغطية API + E2E | **0** | **0%** |

### الحالة العامة

| الطبقة | الحالة | ملخص |
|--------|--------|------|
| **Backend API** | ✅ مكتمل تقريباً | 30 module · 145 endpoint · كل الـ controllers منفَّذة |
| **قاعدة البيانات** | ✅ مكتمل | 30 جدول Sequelize + `relations.ts` · `sequelize.sync()` |
| **المحاسبة والأحداث** | ✅ مكتمل | قيود تلقائية · فترات محاسبية · audit logs (قراءة) |
| **Seed / بيانات تجريبية** | ❌ غير موجود | `database/seeders/seed.ts` **غير موجود** |
| **Frontend HR** | ✅ مكتمل | 21 module بـ CRUD كامل (list + detail) |
| **Frontend Payroll/Accounting** | ❌ غير مبني | payroll · journal · periods · audit · users |
| **Tests** | ❌ غير موجود | `npm test` placeholder |

---

## القسم 2 — حالة الباك إند (Backend)

> **Base path:** `/api/v1` · **Stack:** Express 5 + TypeScript + Sequelize 6 + PostgreSQL  
> **Migration strategy:** `sequelize.sync()` عند التشغيل — **لا توجد** migration files فعلية (ملف `migrations/20260620123038-add-new-fields.js` فارغ)  
> **Seed:** `database/seeders/seed.ts` **غير موجود** — bootstrap admin فقط عبر `database/scripts/migrate-m6-and-admin.ts`

---

### 2.1 — قاعدة البيانات

| الجدول | الـ Model | Migration | Seed | ملاحظة |
|--------|-----------|-----------|------|--------|
| `users` | ✅ | ⚠️ | ⚠️ | script يضيف `force_reset_password` · 1 admin فقط |
| `departments` | ✅ | ❌ | ❌ | sync() فقط |
| `shifts` | ✅ | ❌ | ❌ | sync() فقط |
| `insurance_rates` | ✅ | ❌ | ❌ | model: `insurance_settings.ts` |
| `leave_types` | ✅ | ❌ | ❌ | |
| `holidays` | ✅ | ❌ | ❌ | model: `official_holiday.ts` |
| `absence_types` | ✅ | ❌ | ❌ | |
| `bonus_types` | ✅ | ❌ | ❌ | |
| `allowances` | ✅ | ❌ | ❌ | model: `allowance_types.ts` |
| `accounts` | ✅ | ❌ | ❌ | شجرة GL |
| `accounting_periods` | ✅ | ❌ | ❌ | **جديد** — open/closed |
| `employees` | ✅ | ❌ | ❌ | |
| `employee_contracts` | ✅ | ❌ | ❌ | model: `contracts.ts` |
| `contract_allowances` | ✅ | ❌ | ❌ | |
| `employee_leave_balances` | ✅ | ❌ | ❌ | model: `contract_leaves.ts` |
| `employee_documents` | ✅ | ❌ | ❌ | |
| `employee_contacts` | ✅ | ❌ | ❌ | model: `employee_relatives.ts` |
| `employee_experiences` | ✅ | ❌ | ❌ | model: `employee_experience.ts` |
| `custody_transfers` | ✅ | ❌ | ❌ | model: `custody.ts` |
| `employee_advances_loans` | ✅ | ❌ | ❌ | model: `employee_loans.ts` · `approval_status` |
| `employee_bonuses` | ✅ | ❌ | ❌ | `approval_status` |
| `attendance` | ✅ | ❌ | ❌ | Smart check-in/out |
| `employee_absences` | ✅ | ❌ | ❌ | model: `absences.ts` |
| `leave_requests` | ✅ | ❌ | ❌ | |
| `payroll_runs` | ✅ | ❌ | ❌ | draft/confirmed/paid |
| `payroll_details` | ✅ | ❌ | ❌ | |
| `employee_monthly_payroll_summaries` | ✅ | ❌ | ❌ | internal فقط — بدون API |
| `journal_entries` | ✅ | ❌ | ❌ | draft/posted/cancelled |
| `journal_lines` | ✅ | ❌ | ❌ | nested — بدون API مستقل |
| `audit_logs` | ✅ | ❌ | ❌ | **جديد** — write عبر service فقط |

**Legend:** Migration ❌ = لا يوجد Sequelize migration file (يعتمد على `sync()`) · Seed ❌ = لا بيانات في `seed.ts` · Seed ⚠️ = script يدوي

---

### 2.2 — الـ API Modules

| Module | Controller | Routes | Validation | Period Guard | Audit Log | ملاحظة |
|--------|------------|--------|------------|--------------|-----------|--------|
| auth | ✅ | ✅ | ✅ | N/A | ✅ | login/logout · forget/reset/change password |
| user | ✅ | ✅ | ✅ | N/A | ❌ | + `POST /:id/resetPassword` · random password |
| department | ✅ | ✅ | ⚠️ | ❌ | ❌ | DELETE يستخدم schema خاطئ |
| shift | ✅ | ✅ | ✅ | ❌ | ❌ | |
| leave_types | ✅ | ✅ | ✅ | ❌ | ❌ | |
| official_holidays | ✅ | ✅ | ✅ | ❌ | ❌ | |
| account | ✅ | ✅ | ✅ | ❌ | ❌ | شجرة GL |
| allowance_types | ✅ | ✅ | ✅ | ❌ | ❌ | |
| absence_types | ✅ | ✅ | ✅ | ❌ | ❌ | |
| bonus_types | ✅ | ✅ | ✅ | ❌ | ❌ | |
| insurance_settings | ✅ | ✅ | ✅ | ❌ | ❌ | |
| employees | ✅ | ✅ | ✅ | ❌ | ✅ | CREATE/UPDATE/DELETE |
| employee_documents | ✅ | ✅ | ✅ | ❌ | ❌ | |
| employee_relatives | ✅ | ✅ | ✅ | ❌ | ❌ | |
| employee_experience | ✅ | ✅ | ✅ | ❌ | ❌ | |
| contracts | ✅ | ✅ | ✅ | ❌ | ✅ | CREATE/UPDATE/DELETE |
| contract_allowances | ✅ | ✅ | ✅ | ❌ | ❌ | |
| contract_leaves | ✅ | ✅ | ✅ | ❌ | ❌ | |
| custody | ✅ | ✅ | ✅ | ❌ | ❌ | |
| employee_loans | ✅ | ✅ | ✅ | ✅ | ✅ | **approval workflow** · APPROVE/REJECT audit |
| employee_bonuses | ✅ | ✅ | ✅ | ✅ | ✅ | **approval workflow** · APPROVE/REJECT audit |
| absences | ✅ | ✅ | ✅ | ✅ | ❌ | guard على `absence_date` |
| leave_requests | ✅ | ✅ | ✅ | ✅ | ✅ | APPROVE/REJECT audit + email events |
| attendance | ✅ | ✅ | ✅ | ✅ | ❌ | guard على `work_date` |
| payroll_runs | ✅ | ✅ | ✅ | ✅ | ✅ | 6 endpoints · + recalculate |
| payroll_details | ✅ | ✅ | ❌ | ❌ | ❌ | GET فقط · validation commented out |
| reports | ✅ | ✅ | ❌ | N/A | ❌ | 5 GET endpoints · لا validation file |
| journal_entries | ✅ | ✅ | ✅ | ✅ | ✅ | CREATE/UPDATE/DELETE + status |
| accounting_periods | ✅ | ✅ | ✅ | N/A | ❌ | **جديد** — 4 endpoints · close/reopen |
| audit_logs | ✅ | ✅ | ✅ | N/A | N/A | **جديد** — GET list فقط (read-only) |

**إجمالي:** 30 module · **145 endpoint** (+ `GET /health` في `server.ts`)

---

### 2.3 — الـ Business Logic الجديد (المراحل 1–8)

#### Period Locking

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| Period Locking core | `periodGuard.ts` | ⚠️ جزئي | `isPeriodClosed` · `assertPeriodOpen` · `assertPeriodOpenForDate` |
| guard في attendance | `attendance.controller.ts` | ✅ | POST/PATCH/DELETE على `work_date` |
| guard في absences | `absences.controller.ts` | ✅ | POST/PATCH/DELETE على `absence_date` |
| guard في loans | `employee_loans.controller.ts` | ✅ | POST/PATCH/DELETE على `grant_date` |
| guard في bonuses | `employee_bonuses.controller.ts` | ✅ | POST/PATCH/DELETE على `grant_date` |
| guard في payroll | `payroll_runs.controller.ts` | ✅ | POST/PATCH/DELETE/recalculate على month/year |
| guard في journal | `journal_entries.controller.ts` | ✅ | POST/PATCH/DELETE على `posting_date` |
| guard في leave requests | `leave_requests.controller.ts` | ✅ | POST/PATCH/DELETE على `start_date` |
| guard في باقي modules | — | ❌ | contracts · custody · accounts · departments · … |

#### Reversal Entries

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| LOAN_DELETED reversal | `accounting.listeners.ts` | ✅ | `loan_grant_reversal` |
| LOAN_UPDATED adjustment | `accounting.listeners.ts` | ✅ | `loan_grant_adjustment` |
| BONUS_DELETED reversal | `accounting.listeners.ts` | ✅ | `bonus_cash/deferred_reversal` |
| BONUS_UPDATED adjustment | `accounting.listeners.ts` | ✅ | `bonus_*_adjustment` |
| PAYROLL_DELETED reversal | `accounting.listeners.ts` | ✅ | يلغي posted entries + cancelled |
| LOAN/BONUS create on approve | `employee_loans/bonuses.controller` | ✅ | JE **لا** يُنشأ عند POST — فقط بعد approve |

#### Payroll Transaction

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| JEs في نفس transaction | `payroll_details.services.ts` | ✅ | `createJournalEntriesForPayroll` داخل transaction |
| rollback عند فشل JE | `payroll_details.services.ts` | ✅ | `transaction.rollback()` في catch |
| payroll يقرأ approved فقط | `payroll_source.service.ts` | ✅ | loans: `approval_status=approved` · bonuses: `approval_status=approved` |

#### Audit Log

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| Audit service core | `audit.service.ts` | ✅ | fire-and-forget · JSONB old/new |
| login/logout | `auth.controller.ts` | ✅ | LOGIN · LOGOUT actions |
| payroll operations | `payroll_runs.controller.ts` | ✅ | CREATE/UPDATE/DELETE |
| loan approve/reject | `employee_loans.controller.ts` | ✅ | APPROVE · REJECT · CREATE/UPDATE/DELETE |
| bonus approve/reject | `employee_bonuses.controller.ts` | ✅ | APPROVE · REJECT · CREATE/UPDATE/DELETE |
| leave approve/reject | `leave_requests.controller.ts` | ✅ | APPROVE · REJECT · UPDATE |
| employee CRUD | `employee.controller.ts` | ✅ | CREATE/UPDATE/DELETE |
| contracts CRUD | `contracts.controller.ts` | ✅ | CREATE/UPDATE/DELETE |
| journal entries | `journal_entries.controller.ts` | ✅ | CREATE/UPDATE/DELETE |
| باقي CRUD modules (~22) | — | ❌ | لا audit hooks |

#### Approval Workflow

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| loans approval | `employee_loans.controller.ts` | ✅ | `pending→approved/rejected` · `assertCanChangeApprovalStatus` |
| bonuses approval | `employee_bonuses.controller.ts` | ✅ | نفس النمط · emit `LOAN/BONUS_APPROVED` |
| payroll approved-only source | `payroll_source.service.ts` | ✅ | يتجاهل pending loans/bonuses |

#### Password Policy

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| random password عند create | `user.controller.ts` | ✅ | `crypto.randomBytes(8)` |
| force_reset_password flag | `user.model.ts` + `user.controller.ts` | ✅ | `true` عند create |
| reset endpoint | `user.controller.ts` | ✅ | `POST /user/:id/resetPassword` |
| login يرجع force_reset | `auth.controller.ts` | ✅ | `force_reset_password: true` في response |

#### Health Check

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| DB ping حقيقي | `server.ts` | ✅ | `sequelize.authenticate()` |
| 503 عند DB DOWN | `server.ts` | ✅ | `status: DEGRADED` → HTTP 503 |
| email config status | `server.ts` | ✅ | CONFIGURED / NOT_CONFIGURED |

#### Notifications

| Feature | الملف المسؤول | الحالة | ملاحظة |
|---------|---------------|--------|--------|
| leave approved email | `notification.listeners.ts` | ✅ | `LEAVE_APPROVED` |
| leave rejected email | `notification.listeners.ts` | ✅ | `LEAVE_REJECTED` |
| loan approved email | `notification.listeners.ts` | ✅ | `LOAN_APPROVED` |
| bonus approved email | `notification.listeners.ts` | ✅ | `BONUS_APPROVED` |
| payroll paid email | `notification.listeners.ts` | ✅ | `PAYROLL_PAID` · per employee + staff |
| email skip if unconfigured | `notification.listeners.ts` | ⚠️ | silent skip بدون `EMAIL_USER/PASS` |

---

### 2.4 — الـ Seed Data

> **المصدر الفعلي:** لا `seed.ts` — العدد الفعلي = **0** لكل جدول ما عدا `users` (1 admin via script)

| الجدول | العدد المطلوب | العدد الفعلي | الحالة |
|--------|---------------|--------------|--------|
| `users` | 4 | **1** | ⚠️ admin script فقط |
| `departments` | 6 | **0** | ❌ |
| `shifts` | 3 | **0** | ❌ |
| `insurance_settings` | 2 | **0** | ❌ |
| `leave_types` | 5 | **0** | ❌ |
| `official_holidays` | 5 | **0** | ❌ |
| `absence_types` | 4 | **0** | ❌ |
| `bonus_types` | 4 | **0** | ❌ |
| `allowance_types` | 5 | **0** | ❌ |
| `accounts` | ~30 | **0** | ❌ |
| `accounting_periods` | 7 | **0** | ❌ |
| `employees` | 10 | **0** | ❌ |
| `contracts` | 10 | **0** | ❌ |
| `contract_allowances` | ~35 | **0** | ❌ |
| `contract_leaves` | ~50 | **0** | ❌ |
| `employee_loans` | 5 | **0** | ❌ |
| `employee_bonuses` | 5 | **0** | ❌ |
| `attendance` | ~100 | **0** | ❌ |
| `absences` | 3 | **0** | ❌ |
| `leave_requests` | 4 | **0** | ❌ |
| `payroll_runs` | 6 | **0** | ❌ |
| `payroll_details` | ~60 | **0** | ❌ |
| `journal_entries` | ~90 | **0** | ❌ |
| `journal_lines` | ~400 | **0** | ❌ |
| `audit_logs` | ~10 | **0** | ❌ |

**Seed coverage:** ~**4%** (1 صف في 1 جدول من 25)

---

### 2.5 — الـ openapi.yaml

| البند | الحالة | ملاحظة |
|-------|--------|--------|
| كل الـ endpoints الأصلية موثّقة | ✅ | 145 operation · 68 path |
| `accountingPeriod` endpoints | ✅ | POST · GET · GET/:id · PATCH/:id |
| `auditLog` endpoints | ✅ | GET list + filters |
| approval workflow في loans/bonuses | ✅ | `approval_status` · pending→approved · 403 period lock |
| `force_reset_password` في user/auth | ✅ | create user · login response · resetPassword |
| health check الجديد | ✅ | `/health` — DB + email status |
| period locked 403 في كل endpoint | ⚠️ | موثّق في **7 modules** guarded فقط — ليس الـ 145 كلهم |
| `POST /auth/logout` | ❌ | **غير موثّق** في openapi (موجود في routes) |
| YAML syntax valid | ✅ | verified via `js-yaml` parser |

---

### 2.6 — Tests & Tech Debt

| البند | الحالة |
|-------|--------|
| Automated tests | ❌ 0 ملف · `npm test` placeholder |
| `department` DELETE validation bug | ⚠️ |
| `payroll_details.validation.ts` commented | ⚠️ |
| `payroll_reconciliation.service` stub | ⚠️ |
| Docker port 3000 vs 5000 | ⚠️ |
| GL hierarchy required for accounting | ⚠️ runtime dependency |

---

## القسم 3 — حالة الفرونت إند (Frontend)

> **المشروع:** `newerp/` · Next.js 16 App Router · `next-intl` (ar/en)  
> **ملاحظة المسارات:** المسارات الفعلية camelCase تحت `/[locale]/` — قد تختلف عن المسارات المخططة kebab-case

---

### 3.1 — الإعداد الأساسي

| البند | الملف | الحالة | ملاحظة |
|-------|-------|--------|--------|
| API Client | `lib/axios.ts` | ⚠️ | **ليس** `lib/api.ts` — axios singleton + Bearer interceptor |
| Auth Store | `lib/auth.ts` | ⚠️ | cookies فقط (`auth_token` · `user_data`) — لا Zustand/Context |
| Permissions Helper | — | ❌ | لا `can()` / `allowedTo()` helper |
| Global State (lookups) | — | ❌ | lookups تُجلب per-page في `useEffect` |
| Token Management | `lib/auth.ts` + `middleware.ts` | ⚠️ | save/get/remove · logout لا يمسح `user_data` · 401 handler معطّل |
| Error Handling Global | `app/[locale]/error.tsx` + axios | ⚠️ | error page بسيط · 401 redirect commented · أخطاء API = `console.error` |
| Loading States | `components/ui/Loading.tsx` | ✅ | مستخدم في معظم الصفحات |
| Toast/Notifications UI | `sonner` في `layout.tsx` | ⚠️ | `<Toaster />` mounted · **لا** `toast()` calls في الكود |

**ملفات `lib/` (7):** `axios.ts` · `auth.ts` · `validations/` (login · account · allowanceType · leaveType · officialHoliday)

**Route protection:** `middleware.ts` — redirect لـ `/login` بدون token · **لا** role-based guards

**`.env.local`:** ❌ غير موجود — `baseURL` hardcoded `http://localhost:5000/api/v1`

---

### 3.2 — الشاشات

**Legend:** CRUD = Create (modal) · Read (list+detail) · Update (modal) · Delete (soft)

#### Auth

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD كامل | Roles Guard | Period Guard UI | ملاحظة |
|--------|----------------------|--------|-----------|-------------|-----------------|--------|
| Login | `/ar/login` → `/[locale]/login` | ✅ | N/A | ❌ | N/A | `LoginForm` + zod · لا `force_reset` redirect |
| نسيت كلمة المرور | `/ar/forgot-password` | ❌ | — | — | — | لا صفحة · API موجود |
| إعادة تعيين | `/ar/reset-password` | ❌ | — | — | — | لا صفحة |
| تغيير كلمة المرور | `/ar/change-password` | ❌ | — | — | — | لا صفحة |

#### Dashboard

| الشاشة | المسار | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|--------|--------|------|-------|--------|--------|
| لوحة التحكم | `/[locale]/` | ⚠️ | — | ❌ | — | 3/5 reports · IDs hardcoded |

#### الإعدادات

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|----------------------|--------|------|-------|--------|--------|
| الأقسام | `/ar/departments` → `/departments` | ✅ | ✅ | ❌ | ❌ | list + `[id]` |
| الورديات | `/ar/shifts` → `/shifts` | ✅ | ✅ | ❌ | ❌ | |
| أنواع الإجازات | `/ar/leave-types` → `/leaveTypes` | ✅ | ✅ | ❌ | ❌ | |
| الإجازات الرسمية | `/ar/official-holidays` → `/officialHolidays` | ✅ | ✅ | ❌ | ❌ | |
| أنواع الغياب | `/ar/absence-types` → `/absence_types` | ✅ | ✅ | ❌ | ❌ | |
| أنواع البدلات | `/ar/allowance-types` → `/allowanceTypes` | ✅ | ✅ | ❌ | ❌ | |
| أنواع المكافآت | `/ar/bonus-types` → `/bonus_types` | ✅ | ✅ | ❌ | ❌ | |
| إعدادات التأمينات | `/ar/insurance-settings` → `/insurance_settings` | ✅ | ✅ | ❌ | ❌ | |
| شجرة الحسابات | `/ar/accounts` → `/account` | ✅ | ✅ | ❌ | ❌ | |
| الفترات المحاسبية | `/ar/accounting-periods` | ❌ | — | — | — | **جديد** |
| المستخدمين | `/ar/users` | ❌ | — | — | — | backend جاهز |

#### الموظفين

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|----------------------|--------|------|-------|--------|--------|
| قائمة الموظفين | `/ar/employees` → `/employees` | ✅ | ✅ | ❌ | ❌ | add/edit عبر modal |
| بروفايل موظف | `/ar/employees/[id]` → `/employees/[id]` | ✅ | ⚠️ | ❌ | ❌ | hub: docs · relatives · bonuses · loans · attendance read-only |
| إضافة موظف | `/ar/employees/new` | ⚠️ | — | ❌ | ❌ | **لا `/new`** — modal في القائمة |
| مستندات الموظف | — → `/employeeDocument` | ✅ | ✅ | ❌ | ❌ | |
| أقارب الموظف | — → `/employeeRelative` | ✅ | ✅ | ❌ | ❌ | |
| خبرات الموظف | — → `/employeeExperience` | ✅ | ✅ | ❌ | ❌ | |

#### العقود والمعاملات

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|----------------------|--------|------|-------|--------|--------|
| إدارة العقود | `/ar/contracts` → `/contracts` | ✅ | ✅ | ❌ | ❌ | attachment = text |
| بدلات العقد | — → `/contract_allowances` | ✅ | ✅ | ❌ | ❌ | |
| إجازات العقد | — → `/contract_leaves` | ✅ | ✅ | ❌ | ❌ | |
| العهد (custody) | — → `/custody` | ✅ | ✅ | ❌ | ❌ | |

#### الحضور والإجازات

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|----------------------|--------|------|-------|--------|--------|
| تسجيل حضور | `/ar/attendance` | ❌ | — | — | — | read-only في `employees/[id]` |
| تقرير الحضور | `/ar/attendance/report` | ❌ | — | — | — | |
| طلبات الإجازة | `/ar/leave-requests` → `/leave_requests` | ✅ | ⚠️ | ❌ | ❌ | approve/reject عبر edit form |
| سجل الغياب | `/ar/absences` → `/absences` | ✅ | ✅ | ❌ | ❌ | |

#### المعاملات المالية

| الشاشة | المسار (مخطط → فعلي) | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|----------------------|--------|------|-------|--------|--------|
| السلف والقروض | `/ar/loans` → `/employeeLoan` | ✅ | ⚠️ | ❌ | ❌ | **لا approval UI** |
| المكافآت | `/ar/bonuses` → `/employeeBonus` | ✅ | ⚠️ | ❌ | ❌ | **لا approval UI** |

#### الرواتب

| الشاشة | المسار | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|--------|--------|------|-------|--------|--------|
| دورات الرواتب | `/ar/payroll` | ❌ | — | — | — | |
| تفاصيل دورة | `/ar/payroll/[id]` | ❌ | — | — | — | |
| كشف موظف | `/ar/payroll/[id]/[empId]` | ❌ | — | — | — | |

#### التقارير

| الشاشة | المسار | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|--------|--------|------|-------|--------|--------|
| تكلفة الرواتب | `/ar/reports/payroll-cost` | ⚠️ | — | ❌ | — | dashboard · hardcoded id |
| تقرير السلف | `/ar/reports/loans` | ⚠️ | — | ❌ | — | dashboard chart |
| الخصومات | `/ar/reports/deductions` | ❌ | — | — | — | |
| KPIs شهرية | `/ar/reports/kpis` | ⚠️ | — | ❌ | — | dashboard |
| KPIs سنوية | `/ar/reports/yearly-kpis` | ❌ | — | — | — | |

#### المحاسبة

| الشاشة | المسار | الحالة | CRUD | Roles | Period | ملاحظة |
|--------|--------|--------|------|-------|--------|--------|
| القيود اليومية | `/ar/journal-entries` | ❌ | — | — | — | |
| قيد يدوي | `/ar/journal-entries/new` | ❌ | — | — | — | |
| سجل التدقيق | `/ar/audit-log` | ❌ | — | — | — | **جديد** |

**ملخص:** **44** `page.tsx` · **~25** مسار مخطط ناقص · **0%** role/period guards في UI

---

### 3.3 — الـ Components المشتركة

| Component | الحالة | مستخدم في | ملاحظة |
|-----------|--------|-----------|--------|
| DataTable (بحث + pagination) | ⚠️ | list pages | `DynamicTable` + `SearchInput` + `Pagination` · **لا** column filters |
| Modal / Dialog | ✅ | CRUD modals | `Modal.tsx` |
| Form (مع validation) | ⚠️ | CRUD + login | `DynamicForm` manual required · zod **فقط** في Login |
| Toast Notifications | ⚠️ | — | `sonner` mounted · **غير مستدعى** |
| Loading Spinner | ✅ | pages | `Loading.tsx` |
| ConfirmDelete Dialog | ✅ | list pages | `DeleteRestoreButton` |
| Breadcrumb | ⚠️ | detail pages | inline · **لا** component مشترك |
| Sidebar Navigation | ✅ | main layout | `AppSidebar` — 22 items |
| RoleGuard Component | ❌ | — | |
| PeriodLockedBadge | ❌ | — | **جديد** — لا 403 handling |
| ApprovalBadge | ⚠️ | `leave_requests` | inline colors · loans/bonuses ❌ |
| StatusBadge | ⚠️ | leave · hub | inline · غير reusable |
| DatePicker | ⚠️ | DynamicForm | native `<input type="date">` |
| SearchInput | ✅ | list pages | debounced API |
| Pagination | ✅ | list pages | server-side |
| EmptyState | ⚠️ | DynamicTable | `emptyMessage` prop |
| ErrorBoundary | ⚠️ | global | `error.tsx` minimal |

**أزرار مساعدة (موجودة):** `AddButton` · `EditButton` · `SaveButton` · `StatsCard` · `LanguageToggle` · `Icons`

**إجمالي:** **15** component files

---

### 3.4 — Frontend ↔ Backend Coverage (مرجع سريع)

| Backend Module | Frontend Route | UI | CRUD | Approval UI |
|----------------|---------------|-----|------|-------------|
| department | `/departments` | ✅ | ✅ | — |
| shift | `/shifts` | ✅ | ✅ | — |
| leave_types | `/leaveTypes` | ✅ | ✅ | — |
| official_holidays | `/officialHolidays` | ✅ | ✅ | — |
| account | `/account` | ✅ | ✅ | — |
| allowance_types | `/allowanceTypes` | ✅ | ✅ | — |
| absence_types | `/absence_types` | ✅ | ✅ | — |
| bonus_types | `/bonus_types` | ✅ | ✅ | — |
| insurance_settings | `/insurance_settings` | ✅ | ✅ | — |
| employees | `/employees` | ✅ | ✅ | — |
| employee_documents | `/employeeDocument` | ✅ | ✅ | — |
| employee_relatives | `/employeeRelative` | ✅ | ✅ | — |
| employee_experience | `/employeeExperience` | ✅ | ✅ | — |
| contracts | `/contracts` | ✅ | ✅ | — |
| contract_allowances | `/contract_allowances` | ✅ | ✅ | — |
| contract_leaves | `/contract_leaves` | ✅ | ✅ | — |
| custody | `/custody` | ✅ | ✅ | — |
| employee_loans | `/employeeLoan` | ✅ | ⚠️ | ❌ |
| employee_bonuses | `/employeeBonus` | ✅ | ⚠️ | ❌ |
| absences | `/absences` | ✅ | ✅ | — |
| leave_requests | `/leave_requests` | ✅ | ⚠️ | ⚠️ status في edit |
| auth | `/login` | ⚠️ | — | — |
| user | — | ❌ | — | — |
| attendance | embedded | ⚠️ | read-only | — |
| payroll_runs | — | ❌ | — | — |
| payroll_details | — | ❌ | — | — |
| reports | dashboard | ⚠️ | 3/5 | — |
| journal_entries | — | ❌ | — | — |
| accounting_periods | — | ❌ | — | — |
| audit_logs | — | ❌ | — | — |

**تغطية:** **21/30** module · **0%** role guards · **0%** period lock UI · **~10%** approval UI (leave requests فقط)

---

## القسم 4 — الـ Bugs والمشاكل المعروفة

> **آخر تحقق:** 20 يونيو 2026 — من الكود الفعلي في `erb/` و `newerp/`

---

### 4.1 — مشاكل الباك لسه موجودة

| # | المشكلة | الملف | الخطورة | الحالة |
|---|---------|-------|---------|--------|
| 1 | `PATCH /user` بدون `:id` | `user.routes.ts` | 🔴 عالية | ✅ **تم** — Route الحالي `PATCH /:id` فقط (bug قديم إن وُجد) |
| 2 | ازدواج مصروف المكافأة deferred | `accounting.listeners.ts` + `payrollAccounting.service.ts` | 🔴 محاسبية | ❌ `bonus_deferred` عند approve + `payroll_accrual` يُ Dr `52001` من `total_bonuses` — **لا dedup** |
| 3 | `PAYROLL_PAID` بدون accounting listener | `payroll_runs.controller.ts` · `accounting.listeners.ts` | 🟡 متوسطة | ⚠️ **notification** listener ✅ · **accounting** listener ❌ — settlement JE يُنشأ عند **confirm** لا paid |
| 4 | `isBlock` لا يُفحص في login | `auth.controller.ts` | 🟡 أمن | ❌ يفحص `isActive` فقط — مستخدم `isBlock=true` يدخل |
| 5 | shift update لا يقبل `between` | `shift.validation.ts` | 🟡 | ❌ create: `morning\|evening\|between` · update: `morning\|evening` فقط |
| 6 | `/health` لا يفحص DB | `server.ts` | 🟢 | ✅ **تم** — `sequelize.authenticate()` + 503 عند فشل DB |
| 7 | أخطاء accounting listeners صامتة | `accounting.listeners.ts` | 🟡 | ❌ `wrapHandler` يسجّل `console.error` فقط — لا retry/alert |
| 8 | department DELETE validation خاطئ | `department.routes.ts` | 🟡 | ❌ DELETE يستخدم `updateDepartment` schema بدل `idParam` |
| 9 | `auto_process` خارج Joi | `payroll_runs.validation.ts` | 🟡 | ❌ controller يقرأ `auto_process` (default true) · غير في schema |
| 10 | Account↔Allowance association مكسور | `relations.ts` | 🟡 | ❌ FK `account_id` في relations · model يستخدم `account_code` فقط |
| 11 | `payroll_details.validation` معطّل | `payroll_details.validation.ts` | 🟡 | ❌ الملف commented out بالكامل |
| 12 | `reports` بدون validation | `reports/` | 🟢 | ❌ لا validation file |
| 13 | `payroll_reconciliation` SQL قديم | `payroll_reconciliation.service.ts` | 🟡 | ❌ placeholder · schema mismatches · غير موصول |
| 14 | Docker PORT 3000 vs default 5000 | `docker-compose.yml` · `server.ts` | 🟡 | ❌ `EXPOSE 3000` · server default `5000` |
| 15 | `express.json()` مكرر | `server.ts` | 🟢 | ❌ middleware مسجّل مرتين |
| 16 | `@types/*` في dependencies | `package.json` | 🟢 | ❌ non-standard packaging |
| 17 | `POST /auth/logout` غير موثّق | `openapi.yaml` | 🟢 | ❌ route موجود · missing من OpenAPI |
| 18 | Period guard جزئي | `periodGuard.ts` + controllers | 🟡 | ⚠️ 7 modules فقط — contracts/custody/accounts … بدون guard |
| 19 | Audit log جزئي | controllers متفرقة | 🟡 | ⚠️ ~8/30 modules — الباقي بدون audit |
| 20 | GL hierarchy مطلوب runtime | `accountResolver.service.ts` | 🔴 | ⚠️ accounting events تفشل 404 بدون إعداد شجرة حسابات |
| 21 | Email notifications silent skip | `notification.listeners.ts` | 🟢 | ⚠️ بدون `EMAIL_USER/PASS` لا إرسال ولا warning للمستخدم |
| 22 | `seed.ts` غير موجود | `database/seeders/` | 🟡 | ❌ لا بيانات تجريبية |
| 23 | Zero automated tests | — | 🔴 | ❌ `npm test` placeholder |

#### تفصيل Bug #2 (ازدواج المكافأة deferred)

```
① PATCH bonus approval_status=approved → BONUS_CREATED
   → Dr 52001 (مصروف مكافآت) / Cr ذمم موظفين  [bonus_deferred]

② POST payrollRun confirm → payroll_accrual
   → Dr 52001 (من total_bonuses في payroll_detail) / Cr ذمم  [مرة ثانية]

النتيجة: 600 مصروف مكافآت لنفس 300 EGP
```

**Fix مقترح:** استبعاد deferred bonuses من `total_bonuses` في accrual، أو skip bonus expense line إذا وُجد `bonus_deferred` JE للموظف/الشهر.

---

### 4.2 — مشاكل الفرونت

| # | المشكلة | الشاشة / الملف | الخطورة | الحالة |
|---|---------|----------------|---------|--------|
| 1 | لا approval UI للسلف/القروض | `/employeeLoan` | 🔴 عالية | ❌ لا `approval_status` في form/table — backend يتطلب approve |
| 2 | لا approval UI للمكافآت | `/employeeBonus` | 🔴 عالية | ❌ نفس المشكلة |
| 3 | 401 interceptor معطّل | `lib/axios.ts` | 🔴 أمن | ❌ redirect/clear token commented out |
| 4 | logout لا يمسح `user_data` | `lib/auth.ts` · `AppSidebar` | 🟡 | ❌ `removeToken()` يمسح `auth_token` فقط |
| 5 | logout لا يستدعي API | `AppSidebar.tsx` | 🟡 | ❌ لا `POST /auth/logout` |
| 6 | `force_reset_password` م ignored | `LoginForm.tsx` | 🟡 | ❌ لا redirect لـ change-password |
| 7 | Dashboard IDs hardcoded | `/[locale]/` (main page) | 🟡 | ❌ `payrollCost/1` · `kpis/2` |
| 8 | لا role-based UI | كل الشاشات | 🔴 | ❌ أي مستخدم logged-in يرى كل القوائم |
| 9 | لا period lock 403 handling | كل CRUD pages | 🟡 | ❌ رسالة "الفترة مقفولة" غير معروضة |
| 10 | Toast mounted غير مستخدم | `layout.tsx` + pages | 🟡 | ❌ `sonner` موجود · **0** `toast()` calls |
| 11 | أخطاء API = `console.error` | معظم pages | 🟡 | ❌ لا feedback للمستخدم (إلا login + بعض modals) |
| 12 | Delete يستخدم `alert()` | `deleteButtom.tsx` | 🟢 | ⚠️ confirm modal ✅ · failure = `alert()` |
| 13 | `console.log` في production | `axios.ts` · `middleware.ts` · services | 🟢 | ❌ debug logs متروكة |
| 14 | Login redirect بدون locale | `LoginForm.tsx` | 🟡 | ⚠️ `router.push('/')` — يعتمد على middleware redirect |
| 15 | `.env.local` غير موجود | — | 🟡 | ❌ API URL hardcoded |
| 16 | DynamicForm بدون zod | CRUD modals | 🟡 | ⚠️ validation manual · login فقط يستخدم zod |
| 17 | File upload وهمي | `/employeeDocument` · `/contracts` | 🟡 | ❌ `file_path` / attachment = text input |
| 18 | Duplicate fetch risk | list pages | 🟢 | ⚠️ `SearchInput` + `Pagination` قد يجلبان بشكل منفصل |
| 19 | Error boundary minimal | `error.tsx` | 🟢 | ❌ رسالة عامة بدون recovery |
| 20 | Payroll/Accounting/Users screens | — | 🔴 | ❌ backend جاهز · UI = 0% |

#### شاشات بدون مشاكل functional (CRUD يعمل)

`/departments` · `/shifts` · `/leaveTypes` · `/employees` · `/contracts` · `/absences` · `/leave_requests` (status edit ⚠️) · … — **21 module** list+detail مع API integration صحيح (بافتراض backend + token صالح).

---

### 4.3 — Bugs تم إصلاحها (سجل)

| # | المشكلة | الحالة | ملاحظة |
|---|---------|--------|--------|
| B1 | `PATCH /user` بدون `:id` | ✅ | routes تستخدم `PATCH /:id` |
| B2 | `/health` fake CONNECTED | ✅ | `sequelize.authenticate()` حقيقي |
| B3 | Loan/bonus update/delete بدون accounting events | ✅ | reversal/adjustment في `accounting.listeners.ts` |
| B4 | BONUS_CREATED عند POST (قبل approve) | ✅ | emit فقط عند `approval_status=approved` |
| B5 | LOAN_CREATED عند POST (قبل approve) | ✅ | نفس نمط الموافقة في `employee_loans.controller` |
| B6 | Payroll JE خارج transaction | ✅ | `processPayrollWithAccounting` + rollback |
| B7 | Password = phoneNumber عند create user | ✅ | `crypto.randomBytes(8)` + `force_reset_password` |

---

## القسم 5 — اللي ناقص بالأولوية

> **تعريف الأولويات:**  
> 🔴 **حرج** = بدونها النظام لا يُكمَل دورة العمل الأساسية (HR → رواتب → محاسبة) أو ينتج بيانات/قيود **خاطئة**  
> 🟡 **مهم** = الوظائف موجودة في الـ API لكن التجربة أو الاكتمال ناقص  
> 🟢 **تحسين** = جودة · UX · DevOps — لا يمنع التشغيل

---

### 🔴 حرج (يمنع الاستخدام أو يسبب بيانات غلط)

#### Backend

| # | النقص | التأثير |
|---|-------|---------|
| 1 | **`seed.ts` + بيانات GL (شجرة `accounts`)** | بدون seed: لا departments/employees/contracts/accounts — **أول payroll أو loan approve يفشل** بـ `GL account not found` من `accountResolver` |
| 2 | **ازدواج مصروف المكافأة deferred** (`accounting.listeners` + `payrollAccounting`) | مكافأة deferred تُسجّل **مرتين** في `52001` (عند approve + عند payroll accrual) → **قيود محاسبية خاطئة** |
| 3 | **`isBlock` لا يُفحص في login** | مستخدم محظور (`isBlock=true`) يدخل النظام → **ثغرة أمن/تشغيل** |
| 4 | **Period guard جزئي** (7 modules فقط) | تعديل contracts/custody/accounts على فترة **مقفولة** ممكن عبر API → **كسر إغلاق الفترة** |
| 5 | **Zero automated tests** | أي regression (payroll tx · JE balance · approval) **غير مكتشف** قبل الإنتاج |

#### Frontend

| # | النقص | التأثير |
|---|-------|---------|
| 6 | **شاشات Payroll بالكامل** (`/payroll` · run · details · employee slip) | دورة الرواتب (create → confirm → paid) **غير قابلة للتنفيذ من الواجهة** — جوهر ERP |
| 7 | **Approval UI للسلف والمكافآت** | Backend: `approval_status=pending` · JE **فقط بعد approve** — بدون UI المحاسب/HR **لا يعتمد** من التطبيق → سلف معلّقة + لا قيود |
| 8 | **401 interceptor معطّل** (`lib/axios.ts`) | Token منتهي → طلبات تفشل silently · المستخدم **عالق** بدون redirect للlogin |
| 9 | **Role guards = 0%** | أي مستخدم logged-in يرى **كل** القوائم (payroll · accounting · users) — حتى لو الـ API يرفض 403 |
| 10 | **`.env.local` + API URL hardcoded** | نشر Docker/staging (port 3000 vs 5000) → **Frontend لا يصل للـ API** بدون تعديل كود |

#### مسار حرج (End-to-End)

```
❌ المسار المطلوب اليوم:
   Login ✅ → إعداد GL (account) ✅ UI لكن DB فارغ ❌ seed
   → موظف + عقد ✅
   → سلف/مكافأة ✅ UI لكن approve ❌
   → payroll run ❌ لا UI
   → قيود محاسبية ⚠️ تفشل أو تتضاعف

✅ المسار الذي يعمل فعلاً:
   Login → CRUD HR/settings (21 module) → Dashboard جزئي (3 reports)
```

---

### 🟡 مهم (يؤثر على الاكتمال)

#### Backend

| # | النقص | التأثير |
|---|-------|---------|
| 1 | **`shift.validation` — update بدون `between`** | وردية نوعها `between` **لا تُحدَّث** من API |
| 2 | **`department` DELETE validation bug** | DELETE قد يمر بـ schema خاطئ |
| 3 | **`auto_process` خارج Joi** | `payrollRun` POST — strip unknown fields في middleware قد يكسر auto confirm |
| 4 | **`payroll_details.validation` commented** | GET endpoints بدون validation |
| 5 | **`reports` بدون validation** | query params غير مُتحقَّقة |
| 6 | **Account↔Allowance relation (`account_id` vs `account_code`)** | Sequelize includes على Allowance↔Account **قد تفشل** |
| 7 | **Audit log على ~22 module** | لا أثر لمعظم عمليات CRUD |
| 8 | **`POST /auth/logout` غير موثّق** | OpenAPI ناقص |
| 9 | **`payroll_reconciliation.service` stub** | لا مطابقة payroll vs source |
| 10 | **Docker PORT 3000 vs 5000** | deploy container بدون `.env` PORT → connection fail |
| 11 | **Email silent skip** | notifications لا تُرسل بدون SMTP — **بدون تنبيه** |

#### Frontend

| # | النقص | التأثير |
|---|-------|---------|
| 1 | **شاشة المستخدمين** (`/users`) | SUPER-ADMIN لا يدير users/roles/reset من UI |
| 2 | **Journal entries UI** | مراجعة/إنشاء قيود يدوية — backend جاهز |
| 3 | **Accounting periods UI** | open/close فترة — backend جاهز |
| 4 | **Audit log browser** | `/auditLog` read-only — backend جاهز |
| 5 | **Attendance CRUD** | read-only في employee hub — لا check-in/out مستقل |
| 6 | **Period locked 403 handling** | رسالة «الفترة مقفولة» **غير معروضة** في UI |
| 7 | **`force_reset_password` flow** | login يرجع flag · **لا** redirect لـ change-password |
| 8 | **Auth: forgot / reset / change password** | 3 صفحات ناقصة · API موجود |
| 9 | **Reports كاملة** (5 endpoints) | dashboard يستخدم 3 فقط · hardcoded IDs |
| 10 | **Logout ناقص** | لا API logout · `user_data` cookie يبقى |
| 11 | **Toast/ error feedback** | `sonner` mounted · أخطاء = `console.error` |
| 12 | **Leave approval UX** | approve/reject عبر edit form — **ليس** workflow واضح |
| 13 | **File upload** | documents/contracts = text path فقط |

---

### 🟢 تحسينات (nice to have)

#### Backend

| # | النقص |
|---|-------|
| 1 | Migrations formality بدل `sequelize.sync()` فقط |
| 2 | `express.json()` duplicate في `server.ts` |
| 3 | `@types/*` نقل لـ devDependencies |
| 4 | Swagger UI / serve `openapi.yaml` live |
| 5 | Accounting listeners → queue/retry بدل silent log |
| 6 | API لـ `employee_monthly_payroll_summaries` |
| 7 | Multi-company (`company_id`/`branch_id`) |
| 8 | CI pipeline + lint/test gates |

#### Frontend

| # | النقص |
|---|-------|
| 1 | Export PDF لكشف الراتب / payroll run |
| 2 | Dark mode |
| 3 | Mobile responsive polish (sidebar موجود · tables تحتاج work) |
| 4 | `DynamicForm` + zod لكل module |
| 5 | Global lookups cache (Context/Zustand) |
| 6 | Breadcrumb component مشترك |
| 7 | `ApprovalBadge` · `PeriodLockedBadge` · `RoleGuard` reusable |
| 8 | إزالة `console.log` من axios/middleware/services |
| 9 | Delete failure → toast بدل `alert()` |
| 10 | Error boundary مع retry / home link |
| 11 | i18n keys لرسائل API errors |
| 12 | File drag-and-drop upload |

---

### ملخص تنفيذي — «إيه اللي لازم يتعمل الأول؟»

| الترتيب | المهمة | الطبقة | السبب |
|---------|--------|--------|-------|
| **1** | `seed.ts` + شجرة GL + بيانات تجريبية | Backend | بدونها payroll/accounting **يفشل runtime** |
| **2** | Fix ازدواج bonus deferred | Backend | بيانات محاسبية **خاطئة** |
| **3** | Payroll UI (runs + details) | Frontend | **قلب ERP** غير usable |
| **4** | Approval UI (loans + bonuses) | Frontend | workflow معطّل من الواجهة |
| **5** | `.env.local` + 401 handler | Frontend | استقرار auth/deploy |
| **6** | Role guards (menu + routes) | Frontend | أمان أساسي |
| **7** | `isBlock` في login | Backend | أمان |
| **8** | Accounting periods + journal UI | Frontend | إكمال المحاسبة |
| **9** | Users admin UI | Frontend | إدارة النظام |
| **10** | Tests (payroll + JE + approval) | Backend | منع regression |

---

## القسم 6 — خطة العمل المقترحة (Sprint Plan)

> **المدة المقترحة:** Sprint ≈ 1–2 أسبوع لكل مرحلة (فريق صغير)  
> **الترتيب:** Sprint 1 يفتح **مسار ERP end-to-end** · Sprint 2 يكمّل الرواتب · Sprint 3 المحاسبة والإدارة

---

### Sprint 1 — الأساس والمسار الحرج (لازم يتعمل أول)

| # | المهمة | الطبقة | الملفات / المخرجات | Definition of Done |
|---|--------|--------|---------------------|-------------------|
| 1 | **`database/seeders/seed.ts`** — users(4) · departments · shifts · insurance · leave/absence/bonus/allowance types · **accounts (~30)** · accounting_periods · employees(10) · contracts · contract_allowances/leaves | Backend | `seed.ts` · `npm run seed` | `npm run seed` يملأ DB · admin login يعمل · GL hierarchy جاهزة |
| 2 | **إصلاح ازدواج bonus deferred** | Backend | `payrollAccounting.service.ts` أو `payroll_source.service.ts` | deferred bonus **لا** يُ Dr في `payroll_accrual` إذا وُجد `bonus_deferred` JE |
| 3 | **فحص `isBlock` في login** | Backend | `auth.controller.ts` | `isBlock=true` → 403 «Account blocked» |
| 4 | **`.env.local` + `NEXT_PUBLIC_API_URL`** | Frontend | `newerp/.env.local` · `lib/axios.ts` | لا hardcoded URL · env per environment |
| 5 | **تفعيل 401 interceptor** | Frontend | `lib/axios.ts` | token expired → clear cookies → redirect `/login` |
| 6 | **Approval UI — سلف/قروض** | Frontend | `employeeLoan/page.tsx` · `[id]/page.tsx` · `ApprovalBadge` | عرض `approval_status` · أزرار approve/reject (ACCOUNTING/ADMIN) · `PATCH approval_status` |
| 7 | **Approval UI — مكافآت** | Frontend | `employeeBonus/*` | نفس نمط #6 |
| 8 | **RoleGuard أساسي** | Frontend | `components/RoleGuard.tsx` · `AppSidebar.tsx` | إخفاء menu items حسب `user_data.role` · ACCOUNTING يرى loans/bonuses approve |
| 9 | **Period locked — رسالة API** | Frontend | `lib/axios.ts` interceptor أو helper | 403 «الفترة المحاسبية مقفولة» → toast واضح |
| 10 | **Fix department DELETE validation** | Backend | `department.routes.ts` | DELETE يستخدم `idParam` |

**Exit criteria Sprint 1:**  
`seed` → login → إعداد GL → موظف+عقد → **approve سلفة** → قيد محاسبي يظهر في DB · بدون ازدواج bonus

---

### Sprint 2 — دورة الرواتب (قلب ERP)

| # | المهمة | الطبقة | الملفات / المخرجات | Definition of Done |
|---|--------|--------|---------------------|-------------------|
| 1 | **شاشة Payroll Runs — list** | Frontend | `/payroll` · `payroll/service.ts` | GET `/payrollRun` · filter month/year/status |
| 2 | **إنشاء payroll run** | Frontend | modal/wizard | POST `/payrollRun` · `auto_process` option |
| 3 | **تفاصيل run + recalculate** | Frontend | `/payroll/[id]` | GET run · POST `/:id/recalculate` (draft) · PATCH status |
| 4 | **Payroll details — ملخص run** | Frontend | tab في run detail | GET `/payrollDetail/:run_id` |
| 5 | **كشف موظف** | Frontend | `/payroll/[id]/[empId]` | GET `/payrollDetail/:emp/:run` |
| 6 | **Dashboard — dynamic run id** | Frontend | `(main)/page.tsx` | dropdown payroll run · لا hardcoded `1`/`2` |
| 7 | **`auto_process` في Joi** | Backend | `payroll_runs.validation.ts` | schema يقبل `auto_process: boolean` |
| 8 | **`payroll_details.validation`** | Backend | uncomment + wire routes | GET endpoints validated |
| 9 | **shift update `between`** | Backend | `shift.validation.ts` | update = create types |
| 10 | **Logout كامل** | Frontend | `auth.ts` · `AppSidebar` | clear both cookies · `POST /auth/logout` |

**Exit criteria Sprint 2:**  
مسير رواتب كامل من UI: create → confirm → view details → mark paid → email notification (إن SMTP مُعد)

---

### Sprint 3 — المحاسبة · الإدارة · الاكتمال

| # | المهمة | الطبقة | الملفات / المخرجات | Definition of Done |
|---|--------|--------|---------------------|-------------------|
| 1 | **Journal entries UI** | Frontend | `/journal-entries` · `/new` | CRUD + status patch · period 403 handling |
| 2 | **Accounting periods UI** | Frontend | `/accounting-periods` | list · create · close/reopen |
| 3 | **Users admin UI** | Frontend | `/users` | CRUD · resetPassword · roles |
| 4 | **Audit log browser** | Frontend | `/audit-log` | GET `/auditLog` · filters |
| 5 | **Attendance CRUD** | Frontend | `/attendance` | check-in/out · list · link to employee |
| 6 | **Reports — 5 endpoints** | Frontend | `/reports/*` | payroll-cost · loans · deductions · kpis · yearly |
| 7 | **Auth: change/reset password** | Frontend | `/change-password` · forgot flow | `force_reset` redirect بعد login |
| 8 | **Period guard — باقي modules** | Backend | contracts · custody · accounts controllers | assertPeriodOpen حيث يلزم |
| 9 | **Audit coverage — CRUD modules** | Backend | ~22 controller | auditFromRequest على CREATE/UPDATE/DELETE |
| 10 | **Tests حرجة** | Backend | vitest/jest | payroll tx rollback · bonus dedup · approval · period guard |

**Exit criteria Sprint 3:**  
SUPER-ADMIN يدير users · ACCOUNTING يراجع journal + periods · HR attendance · reports كاملة · tests CI green للمسارات الحرجة

---

### Sprint 4 — تحسينات (اختياري · post-MVP)

| # | المهمة |
|---|--------|
| 1 | Export PDF كشف راتب |
| 2 | File upload (documents/contracts) |
| 3 | Dark mode |
| 4 | Mobile responsive polish |
| 5 | Swagger UI live |
| 6 | Migrations formality (بدل sync-only) |
| 7 | `payroll_reconciliation.service` |
| 8 | CI/CD pipeline |

---

## القسم 7 — إحصائيات الكود

> **تاريخ القياس:** 20 يونيو 2026 · Windows (PowerShell — مكافئ لأوامر `find`)

### أوامر القياس

```bash
# Backend (من مجلد erb/)
find src -name "*.ts" | wc -l
# النتيجة: 115

# Frontend (من مجلد newerp/ — استثناء node_modules و .next)
find . -name "*.tsx" | wc -l
# النتيجة: 64
```

```powershell
# PowerShell (نفس القياس)
# erb/src/*.ts  → 115
# newerp/*.tsx  → 64  (بدون node_modules/.next)
```

### جدول الإحصائيات

| البند | العدد | ملاحظة |
|-------|-------|--------|
| **إجمالي ملفات الباك (`*.ts`)** | **150** | `erb/` كامل بدون `node_modules`/`dist` — منها **`src/` = 115** · `database/` = 33 |
| **إجمالي ملفات الفرونت (`*.ts` + `*.tsx`)** | **100** | `newerp/` بدون `node_modules`/`.next` — منها **`*.tsx` = 64** |
| **إجمالي API endpoints** | **145** | 30 module في `bootstrap.ts` · محقق من `*.routes.ts` (انظر below) |
| **إجمالي DB tables** | **30** | 30 model في `database/Models/` (بدون `relations.ts`) |
| **إجمالي شاشات الفرونت** | **44** | `page.tsx` — 1 login · 1 dashboard · 21 list · 21 detail |
| **إجمالي components** | **15** | `newerp/components/` |
| **أسطر الكود (تقريبي)** | **~27,500** | Backend ~**13,017** · Frontend ~**14,461** |

### تحقق `bootstrap.ts` — Routes & Endpoints

**Modules مسجّلة في `bootstrap.ts`:** **30**

| # | Module | Prefix | Endpoints |
|---|--------|--------|-----------|
| 1 | user | `/api/v1/user` | 6 |
| 2 | auth | `/api/v1/auth` | 6 |
| 3 | department | `/api/v1/department` | 5 |
| 4 | shift | `/api/v1/shift` | 5 |
| 5 | leaveType | `/api/v1/leaveType` | 5 |
| 6 | officialHoliday | `/api/v1/officialHoliday` | 5 |
| 7 | account | `/api/v1/account` | 5 |
| 8 | allowanceType | `/api/v1/allowanceType` | 5 |
| 9 | absenceType | `/api/v1/absenceType` | 5 |
| 10 | bonusType | `/api/v1/bonusType` | 5 |
| 11 | insuranceSettings | `/api/v1/insuranceSettings` | 5 |
| 12 | employee | `/api/v1/employee` | 5 |
| 13 | employeeDocument | `/api/v1/employeeDocument` | 5 |
| 14 | employeeRelative | `/api/v1/employeeRelative` | 5 |
| 15 | employeeExperience | `/api/v1/employeeExperience` | 5 |
| 16 | contract | `/api/v1/contract` | 5 |
| 17 | contractAllowance | `/api/v1/contractAllowance` | 5 |
| 18 | contractLeave | `/api/v1/contractLeave` | 5 |
| 19 | custody | `/api/v1/custody` | 5 |
| 20 | employeeLoan | `/api/v1/employeeLoan` | 5 |
| 21 | employeeBonus | `/api/v1/employeeBonus` | 5 |
| 22 | absence | `/api/v1/absence` | 5 |
| 23 | leaveRequest | `/api/v1/leaveRequest` | 5 |
| 24 | attendance | `/api/v1/attendance` | 5 |
| 25 | payrollRun | `/api/v1/payrollRun` | 6 |
| 26 | payrollDetail | `/api/v1/payrollDetail` | 2 |
| 27 | reports | `/api/v1/reports` | 5 |
| 28 | journalEntry | `/api/v1/journalEntry` | 5 |
| 29 | accountingPeriod | `/api/v1/accountingPeriod` | 4 |
| 30 | auditLog | `/api/v1/auditLog` | 1 |
| | **المجموع** | | **145** |

**+2 في `server.ts`:** `GET /` · `GET /health` (خارج الـ 145)

### تحقق شاشات الفرونت — API Integration

| الفئة | العدد | API | ملاحظة |
|-------|-------|-----|--------|
| Login | 1 | ✅ | `LoginForm` → `POST /auth/login` via `lib/auth.ts` |
| Dashboard | 1 | ⚠️ | `GET /reports/*` (3 endpoints · IDs hardcoded) |
| List + Detail CRUD | 42 | ✅ | `api` أو `*Service` في كل `page.tsx` |
| **المجموع** | **44** | **43/44** | كل الصفحات تتكلم مع API **عند تشغيل backend + token** |

**شاشات تعمل CRUD كامل (21 module):** departments · shifts · leaveTypes · officialHolidays · account · allowanceTypes · absence_types · bonus_types · insurance_settings · employees · employeeDocument · employeeRelative · employeeExperience · contracts · contract_allowances · contract_leaves · custody · employeeLoan · employeeBonus · absences · leave_requests

**قيود runtime (ليست missing pages):**
- بدون **seed + GL** → payroll/loan accounting يفشل 404
- **approval** loans/bonuses → UI لا يرسل `approval_status` (backend يتطلب approve)
- Dashboard/reports → hardcoded IDs

---

## القسم 8 — ما اتعمل vs ما لسه ناقص (مرجع)

### ✅ اتعمل (Done)

**Backend:**
- [x] 30 Sequelize model + associations
- [x] 30 API module · 145 endpoint
- [x] JWT auth + role-based access (`allowedTo`)
- [x] Joi validation (29/30 module)
- [x] Soft delete pattern (`is_deleted`)
- [x] Payroll engine (create → confirm → paid)
- [x] Accounting auto-JEs (loans, bonuses, payroll)
- [x] Accounting periods (open/close)
- [x] Audit logs (write via service + read API)
- [x] Period guard (partial)
- [x] Email notifications (leave, loan, bonus, payroll paid)
- [x] Reports (5 endpoints)
- [x] OpenAPI spec (145 operations)
- [x] Docker setup
- [x] Health check endpoint

**Frontend:**
- [x] Next.js App Router + i18n (ar/en)
- [x] Login + middleware protection
- [x] Sidebar navigation (22 items)
- [x] Generic CRUD scaffold (DynamicTable + DynamicForm)
- [x] 21 HR/settings/transaction modules (list + detail)
- [x] Employee hub page
- [x] Dashboard with charts (partial reports)
- [x] 21 co-located service files

---

### ❌ لسه ناقص (Missing / Incomplete)

**Backend:**
- [ ] `database/seeders/seed.ts` — بيانات تجريبية لـ 25 جدول
- [ ] Automated tests (unit + integration)
- [ ] Audit logging على كل CRUD modules
- [ ] Period guard على كل date-sensitive modules
- [ ] `payroll_details` validation
- [ ] `reports` validation
- [ ] Fix department DELETE validation bug
- [ ] `payroll_reconciliation.service` — implementation كامل
- [ ] API لـ `employee_monthly_payroll_summaries`

**Frontend:**
- [ ] Payroll runs UI (create · confirm · recalculate · paid)
- [ ] Payroll details UI
- [ ] Journal entries UI
- [ ] Accounting periods UI
- [ ] User management UI
- [ ] Audit logs browser
- [ ] Attendance CRUD screen
- [ ] Full reports page (5 endpoints)
- [ ] Auth flows (forget/reset/change password)
- [ ] Role-based menu/route guards
- [ ] File upload (documents · contracts)
- [ ] `.env.local` + configurable API URL
- [ ] 401 auto-redirect
- [ ] API logout integration

---

## القسم 9 — أوامر التشغيل السريعة

```bash
# Backend
cd erb
cp .env.example .env    # عدّل JWT_KEY + DATABASE_URL
npm install
npm run dev             # http://localhost:5000

# Bootstrap admin
npx ts-node database/scripts/migrate-m6-and-admin.ts

# Frontend
cd newerp
npm install
npm run dev             # http://localhost:3000
```

**بيانات الدخول الافتراضية:** `admin@company.com` / `01000000001`

---

*آخر مراجعة: 20 يونيو 2026 — مبنية على قراءة الكود المصدري الفعلي في `erb/` و `newerp/`*
