import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeLeaveBalanceAttributes {
  id: number;
  contract_id: number;
  leave_type_id: number;
  used_days: number;
  year: number;
  is_deleted: boolean;
}

interface EmployeeLeaveBalanceCreationAttributes
  extends Optional<EmployeeLeaveBalanceAttributes, "id" | "used_days" | "is_deleted"> {}

class EmployeeLeaveBalance
  extends Model<EmployeeLeaveBalanceAttributes, EmployeeLeaveBalanceCreationAttributes>
  implements EmployeeLeaveBalanceAttributes
{
  public id!: number;
  public contract_id!: number;
  public leave_type_id!: number;
  public used_days!: number;
  public year!: number;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeLeaveBalance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used_days: {
      type: DataTypes.DECIMAL(5, 1),
      defaultValue: 0,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "employee_leave_balances",
    timestamps: true,
  }
);

export default EmployeeLeaveBalance;