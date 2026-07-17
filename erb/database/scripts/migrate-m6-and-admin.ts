/**
 * Adds missing M6 column + creates default SUPER-ADMIN if not exists.
 * Run: npx ts-node database/scripts/migrate-m6-and-admin.ts
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { sequelize } from "../db.connection";
import User from "../Models/user.model";

dotenv.config();

const SUPER_ADMIN = {
  name: "أحمد السيد",
  email: "admin@company.com",
  phoneNumber: "01000000001",
  password: "01000000001",
  role: "SUPER-ADMIN" as const,
};

async function addForceResetPasswordColumn(): Promise<void> {
  await sequelize.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS force_reset_password BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log("✅ Column force_reset_password ensured on users");
}

async function ensureSuperAdmin(): Promise<void> {
  const existing = await User.findOne({
    where: { email: SUPER_ADMIN.email },
  });

  if (existing) {
    console.log(`ℹ️  SUPER-ADMIN already exists (id=${existing.id}, email=${existing.email})`);
    console.log("   Login: admin@company.com / 01000000001");
    return;
  }

  const user = await User.create({
    name: SUPER_ADMIN.name,
    email: SUPER_ADMIN.email,
    phoneNumber: SUPER_ADMIN.phoneNumber,
    password: SUPER_ADMIN.password,
    role: SUPER_ADMIN.role,
    force_reset_password: false,
    uniqueCode: Math.floor(100000 + Math.random() * 900000),
    isActive: true,
    isBlock: false,
    is_deleted: false,
  });

  console.log(`✅ SUPER-ADMIN created (id=${user.id})`);
  console.log("   Email:    admin@company.com");
  console.log("   Password: 01000000001");
}

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("🔄 Connected to database");

    await addForceResetPasswordColumn();
    await ensureSuperAdmin();

    console.log("✅ Done");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
}

main();
