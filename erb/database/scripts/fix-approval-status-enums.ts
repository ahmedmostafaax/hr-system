/**
 * Fix approval_status columns that were created as VARCHAR (seed/sync)
 * so Sequelize enum sync no longer fails on startup.
 *
 * Run: npx ts-node database/scripts/fix-approval-status-enums.ts
 */
import dotenv from "dotenv";
import { sequelize } from "../db.connection";

dotenv.config();

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
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${table}'
      AND column_name = '${column}';
  `);

  if (!cols?.length) {
    console.log(`⏭️  ${table}.${column} — column not found, skipping`);
    return;
  }

  const udtName = cols[0].udt_name;
  if (udtName === enumName) {
    console.log(`✅ ${table}.${column} — already ${enumName}`);
    return;
  }

  await sequelize.query(`
    ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;
  `);

  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" TYPE "${enumName}"
    USING ("${column}"::text::"${enumName}");
  `);

  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" SET DEFAULT 'pending'::"${enumName}";
  `);

  console.log(`✅ ${table}.${column} — converted to ${enumName}`);
}

async function main() {
  await sequelize.authenticate();

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

  console.log("✅ Approval status enum columns are ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ fix-approval-status-enums failed:", err);
  process.exit(1);
});
