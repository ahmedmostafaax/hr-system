import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface JournalLineAttributes {
  id: number;
  journal_entry_id: number;
  account_id: number;
  account_code?: string | null;
  account_name?: string | null;
  debit: number;
  credit: number;
  description?: string | null;
  employee_id?: number | null;
  cost_center_id?: number | null;
}

export interface JournalLineCreationAttributes
  extends Optional<JournalLineAttributes, "id" | "account_code" | "account_name" | "description" | "employee_id" | "cost_center_id"> {}

class JournalLine
  extends Model<JournalLineAttributes, JournalLineCreationAttributes>
  implements JournalLineAttributes
{
  public id!: number;
  public journal_entry_id!: number;
  public account_id!: number;
  public account_code!: string | null;
  public account_name!: string | null;
  public debit!: number;
  public credit!: number;
  public description!: string | null;
  public employee_id!: number | null;
  public cost_center_id!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JournalLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    journal_entry_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "journal_entries",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "accounts",
        key: "id",
      },
    },

    account_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    account_name: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    debit: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },

    credit: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    cost_center_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "journal_lines",
    timestamps: true,
  }
);

export default JournalLine;