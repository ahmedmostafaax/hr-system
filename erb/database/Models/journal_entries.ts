import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface JournalEntryAttributes {
  id: number;
  reference_type?: string | null;
  reference_id?: number | null;
  payroll_run_id?: number | null; // Kept for backward compatibility
  entry_type: string;
  posting_date: Date;
  description: string;
  total_debit: number;
  total_credit: number;
  status: "draft" | "posted" | "cancelled";
  created_by?: number | null;
  is_deleted?: boolean;
}

interface JournalEntryCreationAttributes
  extends Optional<JournalEntryAttributes, "id" | "reference_type" | "reference_id" | "payroll_run_id" | "status" | "created_by" | "is_deleted"> {}

class JournalEntry
  extends Model<JournalEntryAttributes, JournalEntryCreationAttributes>
  implements JournalEntryAttributes
{
  public id!: number;
  public reference_type!: string | null;
  public reference_id!: number | null;
  public payroll_run_id!: number | null;
  public entry_type!: string;
  public posting_date!: Date;
  public description!: string;
  public total_debit!: number;
  public total_credit!: number;
  public status!: "draft" | "posted" | "cancelled";
  public created_by!: number | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JournalEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    payroll_run_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "payroll_runs",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    entry_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    posting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    total_debit: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    total_credit: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("draft", "posted", "cancelled"),
      allowNull: false,
      defaultValue: "posted",
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "journal_entries",
    timestamps: true,
  }
);

export default JournalEntry;