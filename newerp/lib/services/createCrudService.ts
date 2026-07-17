import api from "@/lib/api";
import type { ApiDeleteResponse, ListParams, ListResponse } from "./types";
import { normalizeServiceError, unwrapResponseData } from "./serviceUtils";

export function createCrudService<T>(basePath: string) {
  return {
    getAll: async (params: ListParams = {}) => {
      try {
        const r = await api.get(basePath, { params });
        return r.data as ListResponse<T>;
      } catch (error) {
        normalizeServiceError(error, "حدث خطأ في جلب البيانات");
      }
    },

    getById: async (id: number | string) => {
      try {
        const r = await api.get(`${basePath}/${id}`);
        return unwrapResponseData<T>(r.data);
      } catch (error) {
        normalizeServiceError(error, "حدث خطأ في جلب البيانات");
      }
    },

    create: async (data: Partial<T>) => {
      try {
        const r = await api.post(basePath, data);
        return unwrapResponseData<T>(r.data);
      } catch (error) {
        normalizeServiceError(error, "حدث خطأ في إنشاء البيانات");
      }
    },

    update: async (id: number | string, data: Partial<T>) => {
      try {
        const r = await api.patch(`${basePath}/${id}`, data);
        return unwrapResponseData<T>(r.data);
      } catch (error) {
        normalizeServiceError(error, "حدث خطأ في تحديث البيانات");
      }
    },

    delete: async (id: number | string) => {
      try {
        const r = await api.delete(`${basePath}/${id}`);
        return r.data as ApiDeleteResponse;
      } catch (error) {
        normalizeServiceError(error, "حدث خطأ في حذف البيانات");
      }
    },
  };
}

export type CrudService<T> = ReturnType<typeof createCrudService<T>>;
