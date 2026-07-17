/**
 * Provision employee + active contract by email (creates employee/user if missing).
 * Usage: npx ts-node database/scripts/provision-employee-contract.ts <email>
 */
import dotenv from "dotenv";
import crypto from "crypto";
import { sequelize } from "../db.connection";
import "../Models/relations";

import User from "../Models/user.model";
import Employee from "../Models/employee";
import EmployeeContract from "../Models/contracts";
import Department from "../Models/department.model";
import Shift from "../Models/shift.model";
import InsuranceRate from "../Models/insurance_settings";

dotenv.config();

const EMAIL = (process.argv[2] || "ahmedhossam1858691977@gmail.com").trim().toLowerCase();

function uniqueCode(): string {
  return `EMP${Date.now().toString().slice(-6)}`;
}

async function main() {
  await sequelize.authenticate();

  const department =
    (await Department.findOne({
      where: { is_deleted: false },
      order: [["id", "ASC"]],
    })) ?? null;

  const shift = await Shift.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });

  const insurance = await InsuranceRate.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });

  if (!department) throw new Error("No department in system");
  if (!shift) throw new Error("No shift in system");

  let user = await User.findOne({
    where: { email: EMAIL, is_deleted: false },
  });

  let employee: Employee | null = null;

  if (user?.employee_id) {
    employee = await Employee.findByPk(user.employee_id);
  }

  if (!employee) {
    employee = await Employee.findOne({
      where: { email: EMAIL, is_deleted: false },
    });
  }

  const displayName = user?.name?.trim() || employee?.full_name?.trim() || "أحمد حسام";
  const phone =
    employee?.phone_number?.trim() ||
    user?.phoneNumber?.trim() ||
    "01018586919";

  if (!employee) {
    employee = await Employee.create({
      code: uniqueCode(),
      full_name: displayName,
      birth_date: new Date("1995-06-15"),
      phone_number: phone,
      gender: "M",
      national_id: `2950615${String(Date.now()).slice(-7)}`,
      email: EMAIL,
      address: "القاهرة، مصر",
      marital_status: "single",
      qualification: "بكالوريوس",
      bank_name: "البنك الأهلي المصري",
      bank_account: "1234567890123456",
      department_id: department.id,
      is_active: true,
      is_deleted: false,
      created_by: 1,
      updated_by: 1,
    });
    console.log("Created employee:", employee.id, employee.code);
  } else {
    await employee.update({
      full_name: displayName,
      email: EMAIL,
      phone_number: phone,
      department_id: department.id,
      is_active: true,
      address: employee.address || "القاهرة، مصر",
      marital_status: employee.marital_status || "single",
      qualification: employee.qualification || "بكالوريوس",
      bank_name: employee.bank_name || "البنك الأهلي المصري",
      bank_account: employee.bank_account || "1234567890123456",
      gender: employee.gender || "M",
      national_id:
        employee.national_id || `2950615${String(employee.id).padStart(7, "0")}`,
      birth_date: employee.birth_date || new Date("1995-06-15"),
    });
    console.log("Updated employee:", employee.id, employee.code);
  }

  if (!user) {
    const password = crypto.randomBytes(8).toString("hex");
    user = await User.create({
      email: EMAIL,
      password,
      name: displayName,
      phoneNumber: phone,
      uniqueCode: Math.floor(100000 + Math.random() * 900000),
      role: "EMPLOYEE",
      employee_id: employee.id,
      force_reset_password: true,
      isActive: true,
    });
    console.log("Created user account. Temp password:", password);
  } else {
    await user.update({
      name: displayName,
      email: EMAIL,
      phoneNumber: phone,
      employee_id: employee.id,
      isActive: true,
    });
    console.log("Linked/updated user:", user.id);
  }

  const existingActive = await EmployeeContract.findOne({
    where: {
      employee_id: employee.id,
      status: "active",
      is_deleted: false,
    },
  });

  const today = new Date().toISOString().split("T")[0];
  let contract = existingActive;

  const insuranceId = insurance?.id ?? 1;

  const contractPayload = {
    department_id: department.id,
    shift_id: shift.id,
    job_title: "موظف",
    base_salary: 8000,
    status: "active" as const,
    overtime_enabled: true,
    is_active: true,
    insurance_setting_id: insuranceId,
  };

  if (!contract) {
    contract = await EmployeeContract.create({
      employee_id: employee.id,
      start_date: today as unknown as Date,
      duration_years: 1,
      end_date: null,
      notes: `عقد للموظف ${displayName}`,
      created_by: 1,
      updated_by: 1,
      is_deleted: false,
      ...contractPayload,
    });
    console.log("Created active contract:", contract.id);
  } else {
    await contract.update({
      ...contractPayload,
      job_title: contract.job_title || "موظف",
      notes: contract.notes || `عقد للموظف ${displayName}`,
    });
    console.log("Updated existing active contract:", contract.id);
  }

  console.log("\n=== Done ===");
  console.log("Employee ID:", employee.id);
  console.log("Code:", employee.code);
  console.log("Name:", employee.full_name);
  console.log("Email:", employee.email);
  console.log("Phone:", employee.phone_number);
  console.log("Department:", department.name);
  console.log("Shift:", shift.name);
  console.log("Contract ID:", contract.id);
  console.log("Base salary:", contract.base_salary, "EGP");
  console.log("Status:", contract.status);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
