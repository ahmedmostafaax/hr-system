"use client";

import { useCallback, useEffect, useState } from "react";
import { notify, type ApiErrorLike } from "@/lib/toast";
import type { CrudService } from "@/lib/services/createCrudService";

const DEFAULT_LIMIT = 20;
const EXPORT_PAGE_SIZE = 500;

export function useListPage<T extends { id: number | string }>(
  service: CrudService<T>,
  extraParams: Record<string, unknown> = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeywordState] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
    setPage(1);
  }, []);

  const fetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const res = await service.getAll({
        page,
        limit,
        keyword: keyword || undefined,
        ...extraParams,
      });
      setData(res.data);
      setTotal(res.meta?.pagination?.totalItems ?? res.data.length);
    } catch (err) {
      if (!options?.silent) {
        notify.handleApiError(err as ApiErrorLike);
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [service, page, limit, keyword, JSON.stringify(extraParams)]);

  const fetchAllData = useCallback(async () => {
    const all: T[] = [];
    let pageNum = 1;
    let totalPages = 1;

    do {
      const res = await service.getAll({
        page: pageNum,
        limit: EXPORT_PAGE_SIZE,
        keyword: keyword || undefined,
        ...extraParams,
      });
      all.push(...(res.data ?? []));
      totalPages = res.meta?.pagination?.totalPages ?? 1;
      pageNum += 1;
    } while (pageNum <= totalPages);

    return all;
  }, [service, keyword, JSON.stringify(extraParams)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (row: T) => {
    setSelected(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (selected) {
      await service.update(selected.id, formData as Partial<T>);
    } else {
      await service.create(formData as Partial<T>);
    }
    await fetch();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await service.delete(deleteTarget.id);
      notify.success("تم الحذف بنجاح");
      setDeleteTarget(null);
      await fetch();
    } catch (err) {
      notify.handleApiError(err as ApiErrorLike);
    } finally {
      setDeleting(false);
    }
  };

  return {
    data,
    total,
    page,
    setPage,
    limit,
    keyword,
    setKeyword,
    loading,
    modalOpen,
    setModalOpen,
    selected,
    setSelected,
    deleteTarget,
    setDeleteTarget,
    deleting,
    fetch,
    fetchAllData,
    handleSave,
    confirmDelete,
    openCreate,
    openEdit,
    closeModal,
  };
}
