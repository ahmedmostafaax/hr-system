/**
 * Full DB setup for employee portal:
 * - EMPLOYEE role + users.employee_id column
 * - Fix approval_status enum columns
 * - Link/create user account per employee with hashed password
 *
 * Run: npm run setup:employees
 * Output: database/scripts/output/employee-credentials.json
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sequelize } from "../db.connection";
import "../Models/relations";
import Employee from "../Models/employee";
import User from "../Models/user.model";

dotenv.config();

function generatePassword() {
  return crypto.randomBytes(8).toString("hex");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (/^01[0125][0-9]{8}$/.test(digits)) return digits;
  const suffix = digits.slice(-8).padStart(8, "0");
  return `010${suffix}`;
}

function employeeEmail(emp: Employee): string {
  if (emp.email?.trim()) return emp.email.trim().toLowerCase();
  const code = emp.code.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || `emp${emp.id}`;
  return `${code}@company.com`;
}

async function ensureSchema() {
  await sequelize.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;
  `);

  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_employee_id_unique
    ON users(employee_id)
    WHERE employee_id IS NOT NULL;
  `);

  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'EMPLOYEE'
      ) THEN
        ALTER TYPE "enum_users_role" ADD VALUE 'EMPLOYEE';
      END IF;
    END$$;
  `);

  console.log("✅ Schema: EMPLOYEE role + users.employee_id");
}

async function fixEnumColumn(
  table: string,
  column: string,
  enumName: string,
  values: string[]
) {
  const valueList = values.map((v) => `'${v}'`).join(", ");

  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN
        CREATE TYPE "${enumName}" AS ENUM (${valueList});
      END IF;
    END$$;
  `);

  const [cols]: any = await sequelize.query(`
    SELECT udt_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${column}';
  `);

  if (!cols?.length) return;
  if (cols[0].udt_name === enumName) return;

  await sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" TYPE "${enumName}"
    USING ("${column}"::text::"${enumName}");
  `);
  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" SET DEFAULT 'pending'::"${enumName}";
  `);
}

async function ensureEnums() {
  await fixEnumColumn(
    "employee_bonuses",
    "approval_status",
    "enum_employee_bonuses_approval_status",
    ["pending", "approved", "rejected"]
  );
  await fixEnumColumn(
    "employee_advances_loans",
    "approval_status",
    "enum_employee_advances_loans_approval_status",
    ["pending", "approved", "rejected"]
  );
  console.log("✅ Enum columns checked");
}

interface CredentialRow {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  email: string;
  phone: string;
  password: string;
  action: "created" | "linked" | "updated";
}

async function setupEmployeeUsers() {
  const employees = await Employee.findAll({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });

  const credentials: CredentialRow[] = [];
  let created = 0;
  let linked = 0;
  let updated = 0;
  let skipped = 0;

  for (const emp of employees) {
    const email = employeeEmail(emp);
    const phone = normalizePhone(emp.phone_number || `0100000${String(emp.id).padStart(4, "0")}`);

    let user: any = await User.findOne({ where: { employee_id: emp.id } });
    let action: CredentialRow["action"] = "updated";

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({
          employee_id: emp.id,
          role: "EMPLOYEE",
          name: emp.full_name,
          phoneNumber: phone,
          isActive: true,
          is_deleted: false,
        });
        action = "linked";
        linked += 1;
      }
    }

    if (!user) {
      const plainPassword = generatePassword();
      user = await User.create({
        name: emp.full_name,
        email,
        phoneNumber: phone,
        password: plainPassword,
        role: "EMPLOYEE",
        employee_id: emp.id,
        uniqueCode: Math.floor(100000 + Math.random() * 900000),
        force_reset_password: true,
        isActive: true,
      });
      action = "created";
      created += 1;

      if (!emp.email) {
        await emp.update({ email });
      }

      credentials.push({
        employee_id: emp.id,
        employee_code: emp.code,
        employee_name: emp.full_name,
        email,
        phone,
        password: plainPassword,
        action,
      });
      continue;
    }

    const plainPassword = generatePassword();
    const hashed = await bcrypt.hash(plainPassword, 8);
    await user.update({
      role: "EMPLOYEE",
      employee_id: emp.id,
      name: emp.full_name,
      email: user.email || email,
      phoneNumber: phone,
      password: hashed,
      force_reset_password: true,
      passwordChangedAt: new Date(),
      isActive: true,
      is_deleted: false,
    });

    if (action === "linked") {
      // already counted
    } else {
      updated += 1;
    }

    credentials.push({
      employee_id: emp.id,
      employee_code: emp.code,
      employee_name: emp.full_name,
      email: user.email || email,
      phone,
      password: plainPassword,
      action: action === "linked" ? "linked" : "updated",
    });
  }

  const adminRoles = ["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"];
  const strayEmployeeUsers = await User.findAll({
    where: { role: "EMPLOYEE", is_deleted: false },
  });
  for (const u of strayEmployeeUsers) {
    if (u.employee_id) continue;
    if (adminRoles.includes(u.role as string)) continue;
    skipped += 1;
  }

  console.log(`✅ Employees processed: ${employees.length}`);
  console.log(`   created: ${created}, linked: ${linked}, passwords reset: ${updated}`);

  return credentials;
}

async function main() {
  await sequelize.authenticate();
  console.log("🔄 Setting up employee portal in database...\n");

  await ensureSchema();
  await ensureEnums();
  const credentials = await setupEmployeeUsers();

  const outDir = path.join(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "employee-credentials.json");
  fs.writeFileSync(outFile, JSON.stringify(credentials, null, 2), "utf-8");

  console.log(`\n📄 Credentials saved to: ${outFile}`);
  console.log("\n--- Sample logins (first 5) ---");
  credentials.slice(0, 5).forEach((c) => {
    console.log(`${c.employee_code} | ${c.email} | ${c.password}`);
  });
  if (credentials.length > 5) {
    console.log(`... and ${credentials.length - 5} more in JSON file`);
  }

  console.log("\n✅ Database setup complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ setup failed:", err);
  process.exit(1);
});
