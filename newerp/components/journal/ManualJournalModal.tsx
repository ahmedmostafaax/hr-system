"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { accountService, journalEntryService } from "@/lib/services";
import type { Account } from "@/lib/services/entities";
import { notify } from "@/lib/toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface JournalLineDraft {
  account_id: string;
  debit: string;
  credit: string;
}

interface ManualJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ENTRY_TYPES = [
  { value: "manual", label: "قيد يدوي" },
  { value: "adjustment", label: "تسوية" },
  { value: "payroll_accrual", label: "استحقاق رواتب" },
  { value: "payroll_settlement", label: "تسوية رواتب" },
  { value: "payroll_insurance_company", label: "تأمينات الشركة" },
  { value: "loan_grant", label: "منح قرض/سلفة" },
  { value: "bonus_cash", label: "مكافأة نقدية" },
  { value: "bonus_deferred", label: "مكافأة مؤجلة" },
];

const emptyLine = (): JournalLineDraft => ({
  account_id: "",
  debit: "",
  credit: "",
});

function parseAmount(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

export function ManualJournalModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualJournalModalProps) {
  const [entryType, setEntryType] = useState("manual");
  const [description, setDescription] = useState("");
  const [postingDate, setPostingDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [lines, setLines] = useState<JournalLineDraft[]>([emptyLine(), emptyLine()]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingAccounts(true);
    accountService
      .getAll({ limit: 500 })
      .then((res) => setAccounts(res.data))
      .catch((err) => notify.handleApiError(err as { message?: string }))
      .finally(() => setLoadingAccounts(false));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { totalDebit, totalCredit, diff } = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += parseAmount(line.debit);
      credit += parseAmount(line.credit);
    }
    debit = Math.round(debit * 100) / 100;
    credit = Math.round(credit * 100) / 100;
    return {
      totalDebit: debit,
      totalCredit: credit,
      diff: Math.round((debit - credit) * 100) / 100,
    };
  }, [lines]);

  const isBalanced = diff === 0 && totalDebit > 0;

  const accountOptions = useMemo(
    () =>
      accounts.map((acc) => ({
        label: `${acc.code} - ${acc.name}`,
        value: acc.id,
        searchText: `${acc.code} ${acc.name}`,
      })),
    [accounts]
  );

  const updateLine = (index: number, patch: Partial<JournalLineDraft>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  };

  const handleDebitChange = (index: number, value: string) => {
    updateLine(index, { debit: value, credit: value ? "" : lines[index].credit });
  };

  const handleCreditChange = (index: number, value: string) => {
    updateLine(index, { credit: value, debit: value ? "" : lines[index].debit });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEntryType("manual");
    setDescription("");
    setPostingDate(new Date().toISOString().split("T")[0]);
    setLines([emptyLine(), emptyLine()]);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const validLines = lines.filter(
      (l) => l.account_id && (parseAmount(l.debit) > 0 || parseAmount(l.credit) > 0)
    );

    if (validLines.length < 2) {
      notify.handleApiError({ message: "يجب إدخال سطرين على الأقل" });
      return;
    }

    if (!description.trim()) {
      notify.handleApiError({ message: "الوصف مطلوب" });
      return;
    }

    setSubmitting(true);
    try {
      await journalEntryService.create({
        entry_type: entryType,
        description: description.trim(),
        posting_date: postingDate,
        status: "posted",
        lines: validLines.map((l) => ({
          account_id: Number(l.account_id),
          debit: parseAmount(l.debit),
          credit: parseAmount(l.credit),
        })),
      } as Parameters<typeof journalEntryService.create>[0]);
      notify.success("تم إنشاء القيد بنجاح");
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">قيد يدوي</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">نوع القيد</label>
              <SearchableSelect
                options={ENTRY_TYPES}
                value={entryType}
                onChange={(val) => setEntryType(String(val))}
                placeholder="— اختر نوع القيد —"
                searchPlaceholder="بحث..."
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">الوصف</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف القيد المحاسبي"
                className={inputClass}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">تاريخ الترحيل</label>
              <input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">بنود القيد</h3>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" /> إضافة سطر
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">الحساب</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600 w-28">مدين</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600 w-28">دائن</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <SearchableSelect
                          options={accountOptions}
                          value={line.account_id}
                          onChange={(val) =>
                            updateLine(index, { account_id: String(val) })
                          }
                          disabled={loadingAccounts}
                          placeholder="— اختر حساب —"
                          searchPlaceholder="بحث بالكود أو الاسم..."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => handleDebitChange(index, e.target.value)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => handleCreditChange(index, e.target.value)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className={`text-sm font-bold px-4 py-3 rounded-lg ${
              isBalanced
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            المدين: {totalDebit.toLocaleString("ar-EG")} | الدائن:{" "}
            {totalCredit.toLocaleString("ar-EG")} | الفرق:{" "}
            {diff.toLocaleString("ar-EG")}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !isBalanced || !description.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ترحيل القيد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
