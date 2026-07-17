import crypto from "crypto";
import bcrypt from "bcrypt";
import { Transaction } from "sequelize";
import User from "../../database/Models/user.model";
import { AppError } from "../utils/appError";

export function generateRandomPassword() {
  return crypto.randomBytes(8).toString("hex");
}

export async function createEmployeeUser(params: {
  employeeId: number;
  name: string;
  email: string;
  phoneNumber: string;
  role?: "EMPLOYEE" | "HR" | "ACCOUNTING" | "ADMIN" | "SUPER-ADMIN";
  transaction?: Transaction;
}) {
  const existingEmail = await User.findOne({
    where: { email: params.email },
    transaction: params.transaction,
  });
  if (existingEmail) {
    throw new AppError("Email already used by another user account", 400);
  }

  const existingLink = await User.findOne({
    where: { employee_id: params.employeeId },
    transaction: params.transaction,
  });
  if (existingLink) {
    throw new AppError("This employee already has a user account", 400);
  }

  const plainPassword = generateRandomPassword();
  const uniqueCode = Math.floor(100000 + Math.random() * 900000);

  const user = await User.create(
    {
      name: params.name,
      email: params.email,
      phoneNumber: params.phoneNumber,
      password: plainPassword,
      role: params.role ?? "EMPLOYEE",
      employee_id: params.employeeId,
      uniqueCode,
      force_reset_password: true,
    },
    { transaction: params.transaction }
  );

  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { user: userWithoutPassword, plainPassword };
}

export async function resetEmployeeUserPassword(employeeId: number) {
  const user: any = await User.findOne({
    where: { employee_id: employeeId, is_deleted: false },
  });

  if (!user) {
    throw new AppError("No user account linked to this employee", 404);
  }

  const plainPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 8);

  user.password = hashedPassword;
  user.force_reset_password = true;
  user.passwordChangedAt = new Date();
  await user.save();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    password: plainPassword,
  };
}
