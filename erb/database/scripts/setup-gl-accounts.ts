/**
 * Seeds the default GL chart (system accounts + per-employee hierarchy).
 * Run: npm run setup:gl
 */
import dotenv from "dotenv";
import { dataBase, sequelize } from "../db.connection";
import "../Models/relations";
import { ensureDefaultChartOfAccounts } from "../../src/service/accounting/defaultChartOfAccounts.service";

async function main() {
  dotenv.config();
  await dataBase.connectionDB();
  console.log("🔄 Seeding GL accounts...");
  await ensureDefaultChartOfAccounts();
  console.log("✅ Default chart of accounts is ready.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ GL setup failed:", err);
  process.exit(1);
});
