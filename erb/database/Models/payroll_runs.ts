import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface PayrollRunAttributes {
  id: number;
  month: number;
  year: number;
  status: "draft" | "confirmed" | "paid";
  processed_at?: Date | null;
  processed_by?: number | null;
  is_deleted: boolean;
  created_by?: number | null;
}

interface PayrollRunCreationAttributes
  extends Optional<
    PayrollRunAttributes,
    "id" | "processed_at" | "processed_by" | "is_deleted"
  > {}

class PayrollRun
  extends Model<PayrollRunAttributes, PayrollRunCreationAttributes>
  implements PayrollRunAttributes
{
  public id!: number;
  public month!: number;
  public year!: number;
  public status!: "draft" | "confirmed" | "paid";
  public processed_at!: Date | null;
  public processed_by!: number | null;
  public is_deleted!: boolean;
  public created_by!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PayrollRun.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "confirmed", "paid"),
      allowNull: false,
      defaultValue: "draft",
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payroll_runs",
    timestamps: true,
  }
);

export default PayrollRun;