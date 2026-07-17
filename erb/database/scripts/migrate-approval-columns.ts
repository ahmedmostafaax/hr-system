/**
 * Ensures approval workflow columns exist for loans/bonuses tables.
 * Run: npx ts-node database/scripts/migrate-approval-columns.ts
 */
import dotenv from "dotenv";
import { sequelize } from "../db.connection";

dotenv.config();

async function ensureEmployeeAdvanceLoansColumns(): Promise<void> {
  await sequelize.query(`
    ALTER TABLE employee_advances_loans
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS approved_by INTEGER NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
  `);

  await sequelize.query(`
    UPDATE employee_advances_loans
    SET approval_status = 'pending'
    WHERE approval_status IS NULL;
  `);

  await sequelize.query(`
    ALTER TABLE employee_advances_loans
    DROP CONSTRAINT IF EXISTS employee_advances_loans_approval_status_check;
  `);

  await sequelize.query(`
    ALTER TABLE employee_advances_loans
    ADD CONSTRAINT employee_advances_loans_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  `);

  console.log("✅ employee_advances_loans approval columns ensured");
}

async function ensureEmployeeBonusesColumns(): Promise<void> {
  await sequelize.query(`
    ALTER TABLE employee_bonuses
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS approved_by INTEGER NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
  `);

  await sequelize.query(`
    UPDATE employee_bonuses
    SET approval_status = 'pending'
    WHERE approval_status IS NULL;
  `);

  await sequelize.query(`
    ALTER TABLE employee_bonuses
    DROP CONSTRAINT IF EXISTS employee_bonuses_approval_status_check;
  `);

  await sequelize.query(`
    ALTER TABLE employee_bonuses
    ADD CONSTRAINT employee_bonuses_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  `);

  console.log("✅ employee_bonuses approval columns ensured");
}

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("🔄 Connected to database");

    await ensureEmployeeAdvanceLoansColumns();
    await ensureEmployeeBonusesColumns();

    console.log("✅ Approval columns migration completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

main();
