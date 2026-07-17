import api from "@/lib/api";
import { createCrudService } from "./createCrudService";
import type { Employee } from "./entities";
import type { EmployeeMySummary } from "../types/employeeMySummary";
import { normalizeServiceError, unwrapResponseData, toServiceError } from "./serviceUtils";

const base = createCrudService<Employee>("/employee");

export type EmployeeCreateResult = {
  employee: Employee;
  userAccount?: {
    password: string;
    email: string;
    id: number;
    name: string;
    role: string;
  };
};

const employeeService = {
  ...base,

  create: async (data: Partial<Employee>): Promise<EmployeeCreateResult> => {
    try {
      const r = await api.post("/employee", data);
      const status = r.status;
      if (status < 200 || status >= 300) {
        throw toServiceError(r.data, "حدث خطأ في إنشاء الموظف");
      }
      return unwrapResponseData<EmployeeCreateResult>(r.data);
    } catch (error) {
      throw toServiceError(error, "حدث خطأ في إنشاء الموظف");
    }
  },

  getMe: async () => {
    try {
      const r = await api.get("/employee/me");
      return unwrapResponseData<Employee>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب بيانات الموظف");
    }
  },

  getMySummary: async (month: number, year: number) => {
    try {
      const r = await api.get("/employee/me/summary", { params: { month, year } });
      return unwrapResponseData<EmployeeMySummary>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب ملخص بيانات الموظف");
    }
  },

  resetUserPassword: async (id: number | string) => {
    try {
      const r = await api.post(`/employee/${id}/reset-user-password`);
      return unwrapResponseData<{
        user: { id: number; name: string; email: string; role: string };
        password: string;
      }>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في إعادة تعيين كلمة المرور");
    }
  },

  createUserAccount: async (id: number | string) => {
    try {
      const r = await api.post(`/employee/${id}/create-user-account`);
      return unwrapResponseData<{
        user: { id: number; name: string; email: string; role: string };
        password: string;
      }>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في إنشاء حساب الموظف");
    }
  },
};

export default employeeService;
export { employeeService };
export type { EmployeeMySummary } from "../types/employeeMySummary";
