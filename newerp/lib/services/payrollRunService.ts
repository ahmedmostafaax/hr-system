import api from "@/lib/api";
import { createCrudService } from "./createCrudService";
import type { PayrollRun } from "./entities";
import { normalizeServiceError, unwrapResponseData } from "./serviceUtils";

/** Full payroll calc + accounting can exceed the default 30s API timeout. */
const PAYROLL_PROCESS_TIMEOUT_MS = 180_000;

const base = createCrudService<PayrollRun>("/payrollRun");

const payrollRunService = {
  ...base,

  create: async (
    data: Partial<PayrollRun> & { auto_process?: boolean }
  ) => {
    const autoProcess = data.auto_process === true;
    try {
      const r = await api.post("/payrollRun", data, {
        timeout: autoProcess ? PAYROLL_PROCESS_TIMEOUT_MS : undefined,
      });
      return unwrapResponseData<PayrollRun>(r.data);
    } catch (error) {
      normalizeServiceError(
        error,
        autoProcess
          ? "انتهت مهلة حساب الرواتب — قد تكون العملية ما زالت جارية، حدّث الصفحة قبل إعادة المحاولة"
          : "حدث خطأ في إنشاء دورة الرواتب"
      );
    }
  },

  recalculate: async (id: number | string) => {
    try {
      const r = await api.post(`/payrollRun/${id}/recalculate`, undefined, {
        timeout: PAYROLL_PROCESS_TIMEOUT_MS,
      });
      return unwrapResponseData<PayrollRun>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في إعادة حساب الرواتب");
    }
  },

  update: async (id: number | string, data: Partial<PayrollRun>) => {
    const longRunning = data.status === "paid";
    try {
      const r = await api.patch(`/payrollRun/${id}`, data, {
        timeout: longRunning ? PAYROLL_PROCESS_TIMEOUT_MS : undefined,
      });
      return unwrapResponseData<PayrollRun>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في تحديث دورة الرواتب");
    }
  },
};

export default payrollRunService;
export { payrollRunService };
