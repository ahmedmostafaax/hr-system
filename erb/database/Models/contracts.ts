import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeContractAttributes {
  id: number;
  employee_id: number;
  department_id: number;
  job_title: string;
  start_date: Date;
  duration_years?: number | null;
  end_date?: Date | null;
  base_salary: number;
  shift_id: number;
  status: "active" | "suspended" | "resigned" | "dismissed";
  overtime_enabled: boolean;
  notes?: string;
  attachment?: string;
  insurance_setting_id: number;
  created_by: number;
  updated_by: number;
  is_active: boolean;
  is_deleted: boolean;
}

interface EmployeeContractCreationAttributes
  extends Optional<
    EmployeeContractAttributes,
    | "id"
    | "duration_years"
    | "end_date"
    | "overtime_enabled"
    | "notes"
    | "attachment"
    | "is_active"
    | "is_deleted"
  > {}

class EmployeeContract
  extends Model<EmployeeContractAttributes, EmployeeContractCreationAttributes>
  implements EmployeeContractAttributes
{
  public id!: number;
  public employee_id!: number;
  public department_id!: number;
  public job_title!: string;
  public start_date!: Date;
  public duration_years!: number | null;
  public end_date!: Date | null;
  public base_salary!: number;
  public shift_id!: number;
  public status!: "active" | "suspended" | "resigned" | "dismissed";
  public overtime_enabled!: boolean;
  public notes!: string;
  public attachment!: string;
  public insurance_setting_id!: number;
  public created_by!: number;
  public updated_by!: number;
  public is_active!: boolean;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeContract.init(
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
    job_title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    base_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    shift_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "suspended", "resigned", "dismissed"),
      allowNull: false,
    },
    overtime_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    insurance_setting_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employee_contracts",
    timestamps: true,
  }
);

export default EmployeeContract;