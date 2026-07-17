import { Op } from "sequelize";
import { erpEmitter, EVENTS } from "./eventEmitter";
import { journalEntryService, JournalLineInput } from "../modules/journal_entries/journalEntry.service";
import { accountResolver } from "../service/accounting/accountResolver.service";
import EmployeeAdvanceLoan from "../../database/Models/employee_loans";
import EmployeeBonus from "../../database/Models/employee_bonuses";
import BonusType from "../../database/Models/bonus_types";
import Employee from "../../database/Models/employee";
import JournalEntry from "../../database/Models/journal_entries";
import JournalLine from "../../database/Models/journal_lines";

type EventUser = { id?: number } | null | undefined;

const round2 = (value: unknown): number => {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

const buildLine = (
  accountId: number,
  debit: number,
  credit: number,
  employeeId?: number,
  description?: string
): JournalLineInput => ({
  account_id: accountId,
  debit: round2(debit),
  credit: round2(credit),
  employee_id: employeeId ?? null,
  description: description ?? null,
});

const logAccountingError = (event: string, error: unknown) => {
  console.error(`❌ [Accounting] ${event} failed:`, error);
};

/** LOAN_CREATED → Dr سلف موظفين – [الموظف] / Cr الصندوق/البنك */
async function handleLoanCreated(loanId: number, user?: EventUser) {
  const loan: any = await EmployeeAdvanceLoan.findByPk(loanId, {
    include: [{ model: Employee, attributes: ["id", "full_name", "code"] }],
  });

  if (!loan || loan.is_deleted) {
    return;
  }

  const amount = round2(loan.amount);
  if (amount <= 0) {
    return;
  }

  const [loanAccount, cashAccount] = await Promise.all([
    accountResolver.resolveEmployeeAccount("loans", loan.employee_id),
    accountResolver.getSystemAccount(accountResolver.cashBankCode),
  ]);

  await journalEntryService.createJournalEntry({
    entry_type: "loan_grant",
    description: `صرف ${loan.type === "loan" ? "قرض" : "سلفة"} – ${loan.Employee?.full_name}`,
    reference_type: "employee_loan",
    reference_id: loan.id,
    lines: [
      buildLine(
        loanAccount.id,
        amount,
        0,
        loan.employee_id,
        `سلف موظفين – ${loan.Employee?.full_name}`
      ),
      buildLine(cashAccount.id, 0, amount, loan.employee_id, "الصندوق/البنك"),
    ],
    created_by: user?.id ?? null,
  });
}

/** BONUS_CREATED → cash: Dr مصروف مكافآت / Cr الصندوق | deferred: Dr مصروف مكافآت / Cr ذمم موظفين */
async function handleBonusCreated(bonusId: number, user?: EventUser) {
  const bonus: any = await EmployeeBonus.findByPk(bonusId, {
    include: [
      { model: Employee, attributes: ["id", "full_name", "code"] },
      { model: BonusType, attributes: ["id", "name", "payment_type"] },
    ],
  });

  if (!bonus || bonus.is_deleted) {
    return;
  }

  const amount = round2(bonus.amount);
  if (amount <= 0) {
    return;
  }

  const paymentType = bonus.BonusType?.payment_type ?? "cash";
  const bonusExpense = await accountResolver.getSystemAccount(
    accountResolver.bonusExpenseCode
  );

  const creditAccount =
    paymentType === "deferred"
      ? await accountResolver.resolveEmployeeAccount("payables", bonus.employee_id)
      : await accountResolver.getSystemAccount(accountResolver.cashBankCode);

  const creditLabel =
    paymentType === "deferred" ? "ذمم موظفين" : "الصندوق/البنك";

  await journalEntryService.createJournalEntry({
    entry_type: paymentType === "deferred" ? "bonus_deferred" : "bonus_cash",
    description: `مكافأة – ${bonus.Employee?.full_name} (${bonus.BonusType?.name ?? ""})`,
    reference_type: "employee_bonus",
    reference_id: bonus.id,
    lines: [
      buildLine(
        bonusExpense.id,
        amount,
        0,
        bonus.employee_id,
        "مصروف مكافآت"
      ),
      buildLine(
        creditAccount.id,
        0,
        amount,
        bonus.employee_id,
        creditLabel
      ),
    ],
    created_by: user?.id ?? null,
  });
}

/** PAYROLL_CONFIRMED — JEs created in transaction via createJournalEntriesForPayroll; this listener is for notifications only. */
async function handlePayrollConfirmed(payrollRunId: number, _user?: EventUser) {
  console.log(
    `📢 [Accounting] PAYROLL_CONFIRMED notification for run ${payrollRunId} (JEs already committed in transaction)`
  );
}

/** PAYROLL_DELETED → reverse all posted entries for the payroll run */
async function handlePayrollDeleted(payrollRunId: number, user?: EventUser) {
  const entries: any[] = await JournalEntry.findAll({
    where: {
      payroll_run_id: payrollRunId,
      is_deleted: false,
      status: "posted",
      entry_type: { [Op.notLike]: "%reversal%" },
    },
    include: [{ model: JournalLine, as: "lines" }],
  });

  for (const entry of entries) {
    const reversalLines: JournalLineInput[] = entry.lines.map((line: any) =>
      buildLine(
        line.account_id,
        round2(line.credit),
        round2(line.debit),
        line.employee_id,
        `عكس: ${line.description ?? entry.description}`
      )
    );

    if (reversalLines.length < 2) {
      continue;
    }

    await journalEntryService.createJournalEntry({
      entry_type: `${entry.entry_type}_reversal`,
      description: `عكس قيد: ${entry.description}`,
      payroll_run_id: payrollRunId,
      reference_type: "journal_entry",
      reference_id: entry.id,
      lines: reversalLines,
      created_by: user?.id ?? null,
    });

    entry.status = "cancelled";
    await entry.save();
  }
}

async function findOriginalReferenceEntry(
  entryTypes: string | string[],
  referenceType: string,
  referenceId: number
): Promise<any | null> {
  const types = Array.isArray(entryTypes) ? entryTypes : [entryTypes];

  return JournalEntry.findOne({
    where: {
      entry_type: { [Op.in]: types },
      reference_type: referenceType,
      reference_id: referenceId,
      is_deleted: false,
      status: { [Op.ne]: "cancelled" },
    },
    include: [{ model: JournalLine, as: "lines" }],
    order: [["id", "ASC"]],
  });
}

async function createReversalFromEntry(
  entry: any,
  reversalEntryType: string,
  referenceType: string,
  referenceId: number,
  description: string,
  user?: EventUser
): Promise<void> {
  const reversalLines: JournalLineInput[] = entry.lines.map((line: any) =>
    buildLine(
      line.account_id,
      round2(line.credit),
      round2(line.debit),
      line.employee_id,
      `عكس: ${line.description ?? entry.description}`
    )
  );

  if (reversalLines.length < 2) {
    return;
  }

  await journalEntryService.createJournalEntry({
    entry_type: reversalEntryType,
    description,
    reference_type: referenceType,
    reference_id: referenceId,
    lines: reversalLines,
    created_by: user?.id ?? null,
  });

  entry.status = "cancelled";
  await entry.save();
}

/** LOAN_DELETED → عكس قيد loan_grant */
async function handleLoanDeleted(
  payload: {
    loanId: number;
    originalAmount: number;
    employeeId: number;
    grantDate: string | Date;
  },
  user?: EventUser
) {
  const { loanId } = payload;

  const original = await findOriginalReferenceEntry(
    "loan_grant",
    "employee_loan",
    loanId
  );

  if (!original) {
    console.log(
      `⚠️ [Accounting] No original loan_grant JE found for loan ${loanId} — skipping reversal`
    );
    return;
  }

  await createReversalFromEntry(
    original,
    "loan_grant_reversal",
    "employee_loan",
    loanId,
    `عكس صرف سلفة/قرض – loan #${loanId}`,
    user
  );
}

/** LOAN_UPDATED → adjustment JE for amount difference */
async function handleLoanUpdated(
  payload: {
    loanId: number;
    oldAmount: number;
    newAmount: number;
    employeeId: number;
  },
  user?: EventUser
) {
  const { loanId, oldAmount, newAmount, employeeId } = payload;
  const diff = round2(newAmount - oldAmount);

  if (diff === 0) {
    return;
  }

  const [loanAccount, cashAccount] = await Promise.all([
    accountResolver.resolveEmployeeAccount("loans", employeeId),
    accountResolver.getSystemAccount(accountResolver.cashBankCode),
  ]);

  const absDiff = Math.abs(diff);
  const lines: JournalLineInput[] =
    diff > 0
      ? [
          buildLine(loanAccount.id, absDiff, 0, employeeId, "تعديل سلف – زيادة"),
          buildLine(cashAccount.id, 0, absDiff, employeeId, "الصندوق/البنك"),
        ]
      : [
          buildLine(cashAccount.id, absDiff, 0, employeeId, "الصندوق/البنك"),
          buildLine(loanAccount.id, 0, absDiff, employeeId, "تعديل سلف – نقص"),
        ];

  await journalEntryService.createJournalEntry({
    entry_type: "loan_grant_adjustment",
    description: `تعديل مبلغ سلفة/قرض #${loanId}: ${oldAmount} → ${newAmount}`,
    reference_type: "employee_loan",
    reference_id: loanId,
    lines,
    created_by: user?.id ?? null,
  });
}

/** BONUS_DELETED → عكس bonus_cash أو bonus_deferred */
async function handleBonusDeleted(
  payload: {
    bonusId: number;
    amount: number;
    paymentType: string;
    employeeId: number;
  },
  user?: EventUser
) {
  const { bonusId } = payload;

  const original = await findOriginalReferenceEntry(
    ["bonus_cash", "bonus_deferred"],
    "employee_bonus",
    bonusId
  );

  if (!original) {
    console.log(
      `⚠️ [Accounting] No original bonus JE found for bonus ${bonusId} — skipping reversal`
    );
    return;
  }

  await createReversalFromEntry(
    original,
    `${original.entry_type}_reversal`,
    "employee_bonus",
    bonusId,
    `عكس مكافأة – bonus #${bonusId}`,
    user
  );
}

/** BONUS_UPDATED → adjustment JE for amount difference */
async function handleBonusUpdated(
  payload: {
    bonusId: number;
    oldAmount: number;
    newAmount: number;
    paymentType: string;
    employeeId: number;
  },
  user?: EventUser
) {
  const { bonusId, oldAmount, newAmount, paymentType, employeeId } = payload;
  const diff = round2(newAmount - oldAmount);

  if (diff === 0) {
    return;
  }

  const bonusExpense = await accountResolver.getSystemAccount(
    accountResolver.bonusExpenseCode
  );

  const creditAccount =
    paymentType === "deferred"
      ? await accountResolver.resolveEmployeeAccount("payables", employeeId)
      : await accountResolver.getSystemAccount(accountResolver.cashBankCode);

  const creditLabel =
    paymentType === "deferred" ? "ذمم موظفين" : "الصندوق/البنك";

  const baseEntryType =
    paymentType === "deferred" ? "bonus_deferred" : "bonus_cash";
  const absDiff = Math.abs(diff);

  const lines: JournalLineInput[] =
    diff > 0
      ? [
          buildLine(bonusExpense.id, absDiff, 0, employeeId, "تعديل مصروف مكافآت – زيادة"),
          buildLine(creditAccount.id, 0, absDiff, employeeId, creditLabel),
        ]
      : [
          buildLine(creditAccount.id, absDiff, 0, employeeId, creditLabel),
          buildLine(bonusExpense.id, 0, absDiff, employeeId, "تعديل مصروف مكافآت – نقص"),
        ];

  await journalEntryService.createJournalEntry({
    entry_type: `${baseEntryType}_adjustment`,
    description: `تعديل مبلغ مكافأة #${bonusId}: ${oldAmount} → ${newAmount}`,
    reference_type: "employee_bonus",
    reference_id: bonusId,
    lines,
    created_by: user?.id ?? null,
  });
}

function wrapHandler(
  eventName: string,
  handler: (...args: any[]) => Promise<void>
) {
  return (...args: any[]) => {
    handler(...args).catch((error) => logAccountingError(eventName, error));
  };
}

export function registerAccountingListeners(): void {
  erpEmitter.on(
    EVENTS.LOAN_CREATED,
    wrapHandler(EVENTS.LOAN_CREATED, handleLoanCreated)
  );
  erpEmitter.on(
    EVENTS.BONUS_CREATED,
    wrapHandler(EVENTS.BONUS_CREATED, handleBonusCreated)
  );
  erpEmitter.on(
    EVENTS.PAYROLL_CONFIRMED,
    wrapHandler(EVENTS.PAYROLL_CONFIRMED, handlePayrollConfirmed)
  );
  erpEmitter.on(
    EVENTS.PAYROLL_DELETED,
    wrapHandler(EVENTS.PAYROLL_DELETED, handlePayrollDeleted)
  );
  erpEmitter.on(
    EVENTS.LOAN_DELETED,
    wrapHandler(EVENTS.LOAN_DELETED, handleLoanDeleted)
  );
  erpEmitter.on(
    EVENTS.LOAN_UPDATED,
    wrapHandler(EVENTS.LOAN_UPDATED, handleLoanUpdated)
  );
  erpEmitter.on(
    EVENTS.BONUS_DELETED,
    wrapHandler(EVENTS.BONUS_DELETED, handleBonusDeleted)
  );
  erpEmitter.on(
    EVENTS.BONUS_UPDATED,
    wrapHandler(EVENTS.BONUS_UPDATED, handleBonusUpdated)
  );

  console.log("✅ [Accounting] Event listeners registered");
}

registerAccountingListeners();
