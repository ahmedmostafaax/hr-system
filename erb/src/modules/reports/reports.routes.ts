import { Router } from "express";
import { auth } from "../auth/auth.controller";
import { reportsController } from "./reports.controller";

const reportsRouter = Router();

// 1. إجمالي تكلفة الرواتب
// مثال: GET /api/v1/reports/payroll-cost?payroll_run_id=1
reportsRouter.get("/payrollCost/:payroll_run_id", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), reportsController.getPayrollCostReport);


// 2. تقرير السلف
// مثال: GET /api/v1/reports/loans
reportsRouter.get("/loans", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), reportsController.getLoansReport);

// 3. تحليل الخصومات
// مثال: GET /api/v1/reports/deductions?payroll_run_id=1
reportsRouter.get("/deductions/:payroll_run_id", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), reportsController.getDeductionsAnalysis);

// 4. مؤشرات الأداء الرئيسية (Monthly KPIs)
// مثال: GET /api/v1/reports/kpis?payroll_run_id=1
reportsRouter.get("/kpis/:payroll_run_id", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), reportsController.getMonthlyKPIs);

// 5. مؤشرات الأداء السنوية الشاملة (Yearly KPIs) بدون بيانات إضافية
// مثال: GET /api/v1/reports/yearly-kpis
reportsRouter.get("/yearly-kpis", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), reportsController.getYearlyKPIs);

reportsRouter.get("/hr-stats", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), reportsController.getHrStats);

export default reportsRouter;
