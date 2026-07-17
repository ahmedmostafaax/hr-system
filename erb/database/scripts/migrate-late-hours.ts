/**
 * Convert stored late_minutes to late_hours (run once on existing DB).
 * Usage: npx ts-node database/scripts/migrate-late-hours.ts
 */
import { sequelize } from "../db.connection";

async function main() {
  const [cols] = await sequelize.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name IN ('late_minutes', 'late_hours')
  `);
  const names = (cols as { column_name: string }[]).map((c) => c.column_name);

  if (names.includes("late_hours") && !names.includes("late_minutes")) {
    console.log("late_hours already migrated.");
    return;
  }

  if (!names.includes("late_hours")) {
    await sequelize.query(`
      ALTER TABLE attendance ADD COLUMN late_hours DECIMAL(6,2) DEFAULT 0;
    `);
    console.log("Added late_hours column.");
  }

  if (names.includes("late_minutes")) {
    await sequelize.query(`
      UPDATE attendance
      SET late_hours = ROUND(COALESCE(late_minutes, 0)::numeric / 60.0, 2)
      WHERE late_hours IS NULL OR late_hours = 0;
    `);
    await sequelize.query(`ALTER TABLE attendance DROP COLUMN late_minutes;`);
    console.log("Migrated late_minutes -> late_hours and dropped late_minutes.");
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
