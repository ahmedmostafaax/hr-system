import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeAdvanceLoanAttributes {
  id: number;
  employee_id: number;
  type: "advance" | "loan";
  amount: number;
  grant_date: Date;
  installment_amount?: number | null;
  paid_amount: number;
  status: "active" | "settled";
  approval_status: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: Date | null;
  rejection_reason?: string | null;
  is_deleted?: boolean;
}

interface EmployeeAdvanceLoanCreationAttributes
  extends Optional<
    EmployeeAdvanceLoanAttributes,
    | "id"
    | "installment_amount"
    | "paid_amount"
    | "approval_status"
    | "approved_by"
    | "approved_at"
    | "rejection_reason"
    | "is_deleted"
  > {}

class EmployeeAdvanceLoan
  extends Model<EmployeeAdvanceLoanAttributes, EmployeeAdvanceLoanCreationAttributes>
  implements EmployeeAdvanceLoanAttributes
{
  public id!: number;
  public employee_id!: number;
  public type!: "advance" | "loan";
  public amount!: number;
  public grant_date!: Date;
  public installment_amount!: number | null;
  public paid_amount!: number;
  public status!: "active" | "settled";
  public approval_status!: "pending" | "approved" | "rejected";
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public rejection_reason!: string | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeAdvanceLoan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("advance", "loan"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    grant_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    installment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("active", "settled"),
      allowNull: false,
    },
    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "employee_advances_loans",
    timestamps: true,
  }
);

export default EmployeeAdvanceLoan;