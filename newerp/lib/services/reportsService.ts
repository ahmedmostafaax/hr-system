import api from "@/lib/api";
import { normalizeServiceError, unwrapResponseData } from "./serviceUtils";

const reportsService = {
  payrollCost: async (payrollRunId: number | string) => {
    try {
      const r = await api.get(`/reports/payrollCost/${payrollRunId}`);
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب تقرير تكلفة الرواتب");
    }
  },

  loans: async (params?: Record<string, unknown>) => {
    try {
      const r = await api.get("/reports/loans", { params });
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب تقرير السلف");
    }
  },

  deductions: async (payrollRunId: number | string) => {
    try {
      const r = await api.get(`/reports/deductions/${payrollRunId}`);
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب تقرير الخصومات");
    }
  },

  kpis: async (payrollRunId: number | string) => {
    try {
      const r = await api.get(`/reports/kpis/${payrollRunId}`);
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب مؤشرات الأداء");
    }
  },

  hrStats: async () => {
    try {
      const r = await api.get("/reports/hr-stats");
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب إحصائيات الموارد البشرية");
    }
  },

  yearlyKpis: async (params?: Record<string, unknown>) => {
    try {
      const r = await api.get("/reports/yearly-kpis", { params });
      return unwrapResponseData<any>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب المؤشرات السنوية");
    }
  },
};

export default reportsService;
export { reportsService };
