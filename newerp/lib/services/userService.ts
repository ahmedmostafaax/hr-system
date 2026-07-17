import api from "@/lib/api";
import { createCrudService } from "./createCrudService";
import type { User } from "./entities";
import { normalizeServiceError, unwrapResponseData } from "./serviceUtils";

const base = createCrudService<User>("/user");

const userService = {
  ...base,

  getAll: async (params: Record<string, unknown> = {}) => {
    try {
      const r = await api.get("/user", { params });
      return r.data as Awaited<ReturnType<typeof base.getAll>>;
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب البيانات");
    }
  },

  create: async (data: Partial<User> & { employee_id?: number }) => {
    try {
      const r = await api.post("/user", data);
      return unwrapResponseData<{
        user: User;
        password: string;
      }>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في إنشاء المستخدم");
    }
  },

  resetPassword: async (id: number | string) => {
    try {
      const r = await api.post(`/user/${id}/resetPassword`);
      return unwrapResponseData<{
        user: Pick<User, "id" | "name" | "role" | "email">;
        password: string;
      }>(r.data);
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في إعادة تعيين كلمة المرور");
    }
  },
};

export default userService;
export { userService };
