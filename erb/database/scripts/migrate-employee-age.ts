/**
 * Add age column to employees and backfill from birth_date.
 * Run: npx ts-node database/scripts/migrate-employee-age.ts
 */
import dotenv from "dotenv";
import { sequelize } from "../db.connection";
import Employee from "../Models/employee";
import { calculateAge } from "../../src/utils/ageUtils";

dotenv.config();

async function main() {
  await sequelize.authenticate();

  await sequelize.query(`
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS age INTEGER;
  `);

  const employees = await Employee.findAll({
    attributes: ["id", "birth_date", "age"],
  });

  let updated = 0;
  for (const emp of employees) {
    if (!emp.birth_date) continue;
    const age = calculateAge(emp.birth_date);
    if (emp.age !== age) {
      await emp.update({ age });
      updated += 1;
    }
  }

  console.log(`✅ employees.age column ready — backfilled ${updated} record(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ migrate-employee-age failed:", err);
  process.exit(1);
});
