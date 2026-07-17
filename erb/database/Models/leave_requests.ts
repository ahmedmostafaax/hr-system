import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface LeaveRequestAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  days_count: number;
  status: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  rejected_by?: number | null;
  reason?: string;
  request_date?: Date;
  is_deleted?: boolean;
}

interface LeaveRequestCreationAttributes
  extends Optional<
    LeaveRequestAttributes,
    "id" | "approved_by" | "rejected_by" | "request_date" | "is_deleted"
  > {}

class LeaveRequest
  extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes>
  implements LeaveRequestAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public start_date!: Date;
  public end_date!: Date;
  public days_count!: number;
  public status!: "pending" | "approved" | "rejected";
  public approved_by!: number | null;
  public rejected_by!: number | null;
  public reason!: string;
  public request_date!: Date;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveRequest.init(
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
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    days_count: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rejected_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    request_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "leave_requests",
    timestamps: true,
  }
);

export default LeaveRequest;