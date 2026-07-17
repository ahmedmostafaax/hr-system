import { Transaction } from "sequelize";
import Employee from "../../../database/Models/employee";
import EmployeeContract from "../../../database/Models/contracts";
import Shift from "../../../database/Models/shift.model";
import InsuranceRate from "../../../database/Models/insurance_settings";
import Department from "../../../database/Models/department.model";
import { AppError } from "../../utils/appError";

async function findActiveContract(
  employeeId: number,
  transaction?: Transaction
): Promise<EmployeeContract | null> {
  return EmployeeContract.findOne({
    where: {
      employee_id: employeeId,
      status: "active",
      is_deleted: false,
      is_active: true,
    },
    order: [["start_date", "DESC"]],
    transaction,
  });
}

async function provisionActiveContract(
  employeeId: number,
  actorUserId: number | null,
  transaction: Transaction
): Promise<EmployeeContract> {
  const id = Number(employeeId);

  const employee: any = await Employee.findOne({
    where: { id, is_deleted: false },
    transaction,
  });

  if (!employee) {
    throw new AppError("الموظف غير موجود", 404);
  }

  const inactiveContract = await EmployeeContract.findOne({
    where: { employee_id: id, is_deleted: false },
    order: [["start_date", "DESC"]],
    transaction,
  });

  if (inactiveContract && inactiveContract.status !== "active") {
    throw new AppError(
      `لا يوجد عقد نشط. العقد الحالي بحالة "${inactiveContract.status}". فعّل العقد من صفحة العقود قبل اعتماد الإجازة.`,
      400
    );
  }

  if (inactiveContract?.status === "active") {
    inactiveContract.is_active = true;
    await inactiveContract.save({ transaction });
    return inactiveContract;
  }

  let departmentId = employee.department_id;

  if (!departmentId) {
    const department = await Department.findOne({
      where: { is_deleted: false },
      order: [["id", "ASC"]],
      transaction,
    });
    departmentId = department?.id ?? null;
  }

  if (!departmentId) {
    throw new AppError(
      "لا يوجد عقد نشط لهذا الموظف. أضف قسمًا للموظف وأنشئ عقدًا نشطًا من صفحة العقود.",
      400
    );
  }

  const shift = await Shift.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
    transaction,
  });

  if (!shift) {
    throw new AppError(
      "لا يمكن اعتماد الإجازة: لا توجد وردية معرّفة في النظام. أضف وردية أولاً.",
      400
    );
  }

  const insurance = await InsuranceRate.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
    transaction,
  });

  const actorId = actorUserId && actorUserId > 0 ? actorUserId : 1;
  const today = new Date().toISOString().split("T")[0];

  const contract = await EmployeeContract.create(
    {
      employee_id: id,
      department_id: departmentId,
      shift_id: shift.id,
      job_title: "موظف",
      start_date: today as unknown as Date,
      base_salary: 1000,
      status: "active",
      overtime_enabled: false,
      insurance_setting_id: insurance?.id ?? null,
      created_by: actorId,
      updated_by: actorId,
      is_active: true,
      is_deleted: false,
    },
    { transaction }
  );

  if (!employee.department_id) {
    employee.department_id = departmentId;
    await employee.save({ transaction });
  }

  return contract;
}

/**
 * Resolves active contract for leave balance updates.
 * On deduct/approve, auto-provisions a minimal contract when missing.
 */
export async function resolveActiveContractForLeave(
  employeeId: number,
  actorUserId: number | null,
  transaction: Transaction,
  options: { allowAutoCreate?: boolean } = {}
): Promise<EmployeeContract> {
  const allowAutoCreate = options.allowAutoCreate !== false;
  const id = Number(employeeId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError("معرف الموظف غير صالح", 400);
  }

  const existing = await findActiveContract(id, transaction);
  if (existing) {
    return existing;
  }

  if (!allowAutoCreate) {
    throw new AppError(
      "لا يوجد عقد نشط لهذا الموظف لتحديث رصيد الإجازة.",
      400
    );
  }

  return provisionActiveContract(id, actorUserId, transaction);
}
