import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface LeaveTypeAttributes {
  id: number;
  name: string;
  annual_balance: number;
  affects_deduction: boolean;
  is_deleted?:boolean
}

interface LeaveTypeCreationAttributes
  extends Optional<LeaveTypeAttributes, "id" | "annual_balance" | "affects_deduction"> {}

class LeaveType
  extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
  implements LeaveTypeAttributes
{
  public id!: number;
  public name!: string;
  public annual_balance!: number;
  public affects_deduction!: boolean;
  public is_deleted!:boolean

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    annual_balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    affects_deduction: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_deleted:{
      type:DataTypes.BOOLEAN,
      defaultValue:false
    }
  },
  {
    sequelize,
    tableName: "leave_types",
    timestamps: true,
  }
);

export default LeaveType;