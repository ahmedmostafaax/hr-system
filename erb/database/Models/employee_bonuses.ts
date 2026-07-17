import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeBonusAttributes {
  id: number;
  employee_id: number;
  bonus_type_id: number;
  amount: number;
  grant_date: Date;
  is_paid: boolean;
  payment_month?: number | null;
  payment_year?: number | null;
  approval_status: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: Date | null;
  rejection_reason?: string | null;
  is_deleted?: boolean;
}

interface EmployeeBonusCreationAttributes
  extends Optional<
    EmployeeBonusAttributes,
    | "id"
    | "is_paid"
    | "payment_month"
    | "payment_year"
    | "approval_status"
    | "approved_by"
    | "approved_at"
    | "rejection_reason"
    | "is_deleted"
  > {}

class EmployeeBonus
  extends Model<EmployeeBonusAttributes, EmployeeBonusCreationAttributes>
  implements EmployeeBonusAttributes
{
  public id!: number;
  public employee_id!: number;
  public bonus_type_id!: number;
  public amount!: number;
  public grant_date!: Date;
  public is_paid!: boolean;
  public payment_month!: number | null;
  public payment_year!: number | null;
  public approval_status!: "pending" | "approved" | "rejected";
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public rejection_reason!: string | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeBonus.init(
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
    bonus_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    grant_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    payment_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payment_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: "employee_bonuses",
    timestamps: true,
  }
);

export default EmployeeBonus;