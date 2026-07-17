import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface PayrollDetailAttributes {
  id: number;
  payroll_run_id: number;
  employee_id: number;

  base_salary: number;
  overtime_pay: number;
  total_allowances: number;
  total_bonuses: number;

  total_earnings: number;

  insurance_employee: number;
  insurance_company: number;
  loan_deduction: number;
  absence_deduction: number;
  absence_days: number;

  total_deductions: number;
  net_salary: number;

  is_deleted  : boolean;
}

interface PayrollDetailCreationAttributes
  extends Optional<PayrollDetailAttributes, "id" | "is_deleted"> {}

class PayrollDetail
  extends Model<PayrollDetailAttributes, PayrollDetailCreationAttributes>
  implements PayrollDetailAttributes
{
  public id!: number;
  public payroll_run_id!: number;
  public employee_id!: number;

  public base_salary!: number;
  public overtime_pay!: number;
  public total_allowances!: number;
  public total_bonuses!: number;

  public total_earnings!: number;

  public insurance_employee!: number;
  public insurance_company!: number;
  public loan_deduction!: number;
  public absence_deduction!: number;
  public absence_days!: number;

  public total_deductions!: number;
  public net_salary!: number;

  public is_deleted!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PayrollDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    payroll_run_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payroll_runs",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    base_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    overtime_pay: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    total_allowances: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    total_bonuses: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    total_earnings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    insurance_employee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    insurance_company: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    loan_deduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    absence_deduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    absence_days: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },

    total_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    net_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "payroll_details",
    timestamps: true,
  }
);

export default PayrollDetail;