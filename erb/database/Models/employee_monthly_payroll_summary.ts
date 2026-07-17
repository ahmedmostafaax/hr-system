import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";
import Employee from "./employee";

export interface EmployeeMonthlyPayrollSummaryAttributes {
  id: number;
  company_id?: number | null; // For future multi-company support
  branch_id?: number | null; // For future multi-branch support
  employee_id: number;
  month: number;
  year: number;

  attended_days: number;
  absence_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  overtime_hours: number;

  total_bonus: number;
  total_allowances: number;
  total_deductions: number;
  loan_deductions: number;

  gross_salary?: number;
  net_salary?: number;

  version: number;
}

export interface EmployeeMonthlyPayrollSummaryCreationAttributes
  extends Optional<
    EmployeeMonthlyPayrollSummaryAttributes,
    | "id"
    | "company_id"
    | "branch_id"
    | "attended_days"
    | "absence_days"
    | "paid_leave_days"
    | "unpaid_leave_days"
    | "overtime_hours"
    | "total_bonus"
    | "total_allowances"
    | "total_deductions"
    | "loan_deductions"
    | "gross_salary"
    | "net_salary"
    | "version"
  > {}

export class EmployeeMonthlyPayrollSummary
  extends Model<
    EmployeeMonthlyPayrollSummaryAttributes,
    EmployeeMonthlyPayrollSummaryCreationAttributes
  >
  implements EmployeeMonthlyPayrollSummaryAttributes
{
  public id!: number;
  public company_id!: number | null;
  public branch_id!: number | null;
  public employee_id!: number;
  public month!: number;
  public year!: number;

  public attended_days!: number;
  public absence_days!: number;
  public paid_leave_days!: number;
  public unpaid_leave_days!: number;
  public overtime_hours!: number;

  public total_bonus!: number;
  public total_allowances!: number;
  public total_deductions!: number;
  public loan_deductions!: number;

  public gross_salary!: number;
  public net_salary!: number;
  public version!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeMonthlyPayrollSummary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Employee,
        key: "id",
      },
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attended_days: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    absence_days: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    paid_leave_days: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    unpaid_leave_days: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    total_bonus: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_allowances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_deductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    loan_deductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    gross_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // will be recalculated dynamically
    },
    net_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // will be recalculated dynamically
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "employee_monthly_payroll_summaries",
    timestamps: true,
    version: true, // Automatically handle optimistic locking
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "month", "year"],
        name: "idx_emp_month_year",
      },
      {
        fields: ["company_id"],
      },
      {
        fields: ["branch_id"],
      },
    ],
  }
);

export default EmployeeMonthlyPayrollSummary;
