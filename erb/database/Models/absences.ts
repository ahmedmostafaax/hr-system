import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeAbsenceAttributes {
  id: number;
  employee_id: number;
  absence_type_id: number;
  absence_date: Date;
  deduction_days: number;
  notes?: string | null;
  is_deleted?: boolean;
}

interface EmployeeAbsenceCreationAttributes
  extends Optional<EmployeeAbsenceAttributes, "id" | "notes" | "is_deleted"> {}

class EmployeeAbsence
  extends Model<EmployeeAbsenceAttributes, EmployeeAbsenceCreationAttributes>
  implements EmployeeAbsenceAttributes
{
  public id!: number;
  public employee_id!: number;
  public absence_type_id!: number;
  public absence_date!: Date;
  public deduction_days!: number;
  public notes!: string | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeAbsence.init(
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
    absence_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    absence_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    deduction_days: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
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
    tableName: "employee_absences",
    timestamps: true,
  }
);

export default EmployeeAbsence;