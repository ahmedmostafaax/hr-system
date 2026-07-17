import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface AttendanceAttributes {
  id: number;
  employee_id: number;
  department_id: number;
  work_date: string;
  check_in?: string | null;
  check_out?: string | null;
  late_hours: number;
  overtime_hours: number;
  working_hours?: number  | null;
  notes?: string | null;
  is_deleted: boolean;
}

interface AttendanceCreationAttributes
  extends Optional<
    AttendanceAttributes,
    | "id"
    | "check_in"
    | "check_out"
    | "late_hours"
    | "overtime_hours"
    | "working_hours"
    | "notes"
    | "is_deleted"
  > {}

class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  public id!: number;
  public employee_id!: number;
  public department_id!: number;
  public work_date!: string;
  public check_in!: string | null;
  public check_out!: string | null;
  public late_hours!: number;
  public overtime_hours!: number;
  public working_hours!: number  | null;
  public notes!: string | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
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
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    work_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    check_in: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    check_out: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    late_hours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0,
    },
    working_hours: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0,
    },
    notes: {
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
    tableName: "attendance",
    timestamps: true,
  }
);

export default Attendance;