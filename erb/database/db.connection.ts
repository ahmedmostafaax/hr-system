import { Sequelize, Options } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not defined. Add it to your .env file (see .env.example)."
    );
  }
  return url;
}

function buildSequelizeOptions(): Options {
  const options: Options = {
    dialect: "postgres",
    logging: process.env.DB_LOGGING === "true",
  };

  // Neon/cloud Postgres needs SSL; set DB_SSL=false for local Postgres without SSL
  if (process.env.DB_SSL !== "false") {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return options;
}

export const sequelize = new Sequelize(getDatabaseUrl(), buildSequelizeOptions());

class DataBase {
  private static instance: DataBase;

  private constructor() {}

  static getInstance(): DataBase {
    if (!DataBase.instance) {
      DataBase.instance = new DataBase();
    }
    return DataBase.instance;
  }

  async connectionDB(): Promise<void> {
    try {
      console.log("🔄 [DB] Authenticating connection to PostgreSQL...");
      await sequelize.authenticate();
      console.log("✅ [DB] Connection has been established successfully.");

      const shouldSync = process.env.DB_SYNC === "true";
      if (shouldSync) {
        console.log("🔄 [DB] Syncing database models (DB_SYNC=true)...");
        await sequelize.sync();
        console.log("✅ [DB] Database models synced successfully.");
      } else {
        console.log(
          "⏭️ [DB] Skipping model sync (set DB_SYNC=true in .env to enable)."
        );
      }
    } catch (error) {
      console.error("❌ [DB] Unable to connect to the database:", error);
      throw error;
    }
  }
}

export const dataBase = DataBase.getInstance();
