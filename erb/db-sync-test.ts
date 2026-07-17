import { dataBase } from './database/db.connection';
import "./database/Models/relations"

const test = async () => {
  console.log("🔄 Starting DB connection & sync test...");
  try {
    await dataBase.connectionDB();
    console.log("✅ DB connection & sync test finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed with error:", err);
    process.exit(1);
  }
};
test();
