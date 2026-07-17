/**
 * Add EMPLOYEE role and employee_id link on users.
 * Run: npx ts-node database/scripts/migrate-employee-user-role.ts
 */
import dotenv from "dotenv";
import { sequelize } from "../db.connection";

dotenv.config();

async function main() {
  await sequelize.authenticate();

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

  console.log("✅ EMPLOYEE role and users.employee_id are ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ migrate-employee-user-role failed:", err);
  process.exit(1);
});
