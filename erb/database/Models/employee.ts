import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeAttributes {
  id: number;
  code: string;
  full_name: string;
  birth_date: Date;
  phone_number: string;
  gender: "M" | "F";
  national_id: string;
  email?: string;
  address?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed";
  qualification?: string;
  bank_name?: string;
  bank_account?: string;
  created_at?: Date;
  department_id?: number;
  age?: number;
  is_deleted?: boolean;
  is_active?: boolean;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
}

interface EmployeeCreationAttributes
  extends Optional<
    EmployeeAttributes,
    | "id"
    | "email"
    | "address"
    | "marital_status"
    | "qualification"
    | "bank_name"
    | "bank_account"
    | "created_at"
    | "department_id"
    | "age"
    | "is_deleted"
    | "is_active"
    | "created_by"
    | "updated_by"
    | "deleted_by"
  > {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: number;
  public code!: string;
  public full_name!: string;
  public birth_date!: Date;
  public gender!: "M" | "F";
  public national_id!: string;
  public email!: string;
  public address!: string;
  public marital_status!: "single" | "married" | "divorced" | "widowed";
  public qualification!: string;
  public bank_name!: string;
  public bank_account!: string;
  public created_at!: Date;
  public is_deleted!: boolean;
  public is_active!: boolean;
  public created_by!: number;
  public updated_by!: number;
  public deleted_by!: number;
  public phone_number!: string;
  public department_id!: number;
  public age!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("M", "F"),
      allowNull: false,
    },
    national_id: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marital_status: {
      type: DataTypes.ENUM("single", "married", "divorced", "widowed"),
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_account: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employees",
    timestamps: true,
  }
);

export default Employee;