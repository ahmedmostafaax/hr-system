import { Op } from "sequelize";
import { erpEmitter, EVENTS } from "./eventEmitter";
import { sendEmail } from "../service/email/sendEmail";
import { emailTemplate } from "../service/email/emailTemplate";
import Employee from "../../database/Models/employee";
import User from "../../database/Models/user.model";
import PayrollRun from "../../database/Models/payroll_runs";
import PayrollDetail from "../../database/Models/payroll_details";

type LeaveApprovedPayload = {
  employeeId: number;
  days: number;
  leaveType: string;
};

type LeaveRejectedPayload = {
  employeeId: number;
  reason?: string;
  leaveType?: string;
  days?: number;
};

type LoanApprovedPayload = {
  employeeId: number;
  amount: number;
  type: "advance" | "loan";
};

type BonusApprovedPayload = {
  employeeId: number;
  amount: number;
};

const logNotificationError = (context: string, error: unknown) => {
  console.error(`❌ [Notification] ${context} failed:`, error);
};

const isEmailConfigured = (): boolean =>
  !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

async function getStaffEmails(): Promise<string[]> {
  const users = await User.findAll({
    where: {
      role: { [Op.in]: ["HR", "ACCOUNTING"] },
      is_deleted: false,
      isActive: true,
      isBlock: false,
    },
    attributes: ["email"],
  });

  return users
    .map((user) => user.email)
    .filter((email): email is string => !!email);
}

async function sendToRecipient(email: string, message: string): Promise<void> {
  if (!isEmailConfigured()) {
    return;
  }
  await sendEmail({ email, message });
}

async function notifyEmployeeAndStaff(
  employeeEmail: string | null | undefined,
  employeeMessage: string,
  staffMessage?: string
): Promise<void> {
  if (employeeEmail) {
    try {
      await sendToRecipient(employeeEmail, employeeMessage);
    } catch (error) {
      logNotificationError(`employee email (${employeeEmail})`, error);
    }
  }

  const staffEmails = await getStaffEmails();
  const messageForStaff = staffMessage ?? employeeMessage;

  for (const email of staffEmails) {
    try {
      await sendToRecipient(email, messageForStaff);
    } catch (error) {
      logNotificationError(`staff email (${email})`, error);
    }
  }
}

async function handleLeaveApproved(payload: LeaveApprovedPayload) {
  const employee = await Employee.findByPk(payload.employeeId);
  if (!employee) {
    return;
  }

  const message = emailTemplate.leaveApproved({
    name: employee.full_name,
    days: payload.days,
    leaveType: payload.leaveType,
  });

  const staffMessage = `<p>تمت الموافقة على إجازة الموظف <strong>${employee.full_name}</strong> (${payload.leaveType}) لمدة ${payload.days} يوم/أيام.</p>`;

  await notifyEmployeeAndStaff(employee.email, message, staffMessage);
}

async function handleLeaveRejected(payload: LeaveRejectedPayload) {
  const employee = await Employee.findByPk(payload.employeeId);
  if (!employee) {
    return;
  }

  const message = emailTemplate.leaveRejected({
    name: employee.full_name,
    reason: payload.reason,
  });

  const staffMessage = `<p>تم رفض طلب إجازة الموظف <strong>${employee.full_name}</strong>${payload.leaveType ? ` (${payload.leaveType})` : ""}.</p>${payload.reason ? `<p>السبب: ${payload.reason}</p>` : ""}`;

  await notifyEmployeeAndStaff(employee.email, message, staffMessage);
}

async function handleLoanApproved(payload: LoanApprovedPayload) {
  const employee = await Employee.findByPk(payload.employeeId);
  if (!employee) {
    return;
  }

  const message = emailTemplate.loanApproved({
    name: employee.full_name,
    amount: payload.amount,
    type: payload.type,
  });

  const typeLabel = payload.type === "loan" ? "قرض" : "سلفة";
  const staffMessage = `<p>تمت الموافقة على ${typeLabel} للموظف <strong>${employee.full_name}</strong> بمبلغ ${payload.amount}.</p>`;

  await notifyEmployeeAndStaff(employee.email, message, staffMessage);
}

async function handleBonusApproved(payload: BonusApprovedPayload) {
  const employee = await Employee.findByPk(payload.employeeId);
  if (!employee) {
    return;
  }

  const message = emailTemplate.bonusApproved({
    name: employee.full_name,
    amount: payload.amount,
  });

  const staffMessage = `<p>تمت الموافقة على مكافأة للموظف <strong>${employee.full_name}</strong> بمبلغ ${payload.amount}.</p>`;

  await notifyEmployeeAndStaff(employee.email, message, staffMessage);
}

async function handlePayrollPaid(payrollRunId: number) {
  const run = await PayrollRun.findByPk(payrollRunId);
  if (!run) {
    return;
  }

  const details: any[] = await PayrollDetail.findAll({
    where: { payroll_run_id: payrollRunId, is_deleted: false },
    include: [{ model: Employee, attributes: ["id", "full_name", "email"] }],
  });

  for (const detail of details) {
    const employee = detail.Employee;
    if (!employee?.email) {
      continue;
    }

    try {
      await sendToRecipient(
        employee.email,
        emailTemplate.payrollPaid({
          name: employee.full_name,
          netSalary: parseFloat(String(detail.net_salary)),
          month: run.month,
          year: run.year,
        })
      );
    } catch (error) {
      logNotificationError(`payroll paid — employee ${employee.id}`, error);
    }
  }

  const staffMessage = `<p>تم صرف مسير رواتب <strong>${run.month}/${run.year}</strong> لـ <strong>${details.length}</strong> موظف/موظفين.</p>`;
  const staffEmails = await getStaffEmails();

  for (const email of staffEmails) {
    try {
      await sendToRecipient(email, staffMessage);
    } catch (error) {
      logNotificationError(`payroll paid — staff (${email})`, error);
    }
  }
}

function wrapHandler(
  eventName: string,
  handler: (...args: any[]) => Promise<void>
) {
  return (...args: any[]) => {
    handler(...args).catch((error) => logNotificationError(eventName, error));
  };
}

export function registerNotificationListeners(): void {
  erpEmitter.on(
    EVENTS.LEAVE_APPROVED,
    wrapHandler(EVENTS.LEAVE_APPROVED, handleLeaveApproved)
  );
  erpEmitter.on(
    EVENTS.LEAVE_REJECTED,
    wrapHandler(EVENTS.LEAVE_REJECTED, handleLeaveRejected)
  );
  erpEmitter.on(
    EVENTS.LOAN_APPROVED,
    wrapHandler(EVENTS.LOAN_APPROVED, handleLoanApproved)
  );
  erpEmitter.on(
    EVENTS.BONUS_APPROVED,
    wrapHandler(EVENTS.BONUS_APPROVED, handleBonusApproved)
  );
  erpEmitter.on(
    EVENTS.PAYROLL_PAID,
    wrapHandler(EVENTS.PAYROLL_PAID, handlePayrollPaid)
  );

  console.log("✅ [Notification] Event listeners registered");
}

registerNotificationListeners();
