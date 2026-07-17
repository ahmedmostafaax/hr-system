import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeExperienceAttributes {
  id: number;
  employee_id: number;
  company_name: string;
  position?: string;
  from_date: Date;
  to_date?: Date | null;
  is_deleted?: boolean;
  employee_code: string;  
}

interface EmployeeExperienceCreationAttributes
  extends Optional<EmployeeExperienceAttributes, "id" | "position" | "to_date"> {}

class EmployeeExperience
  extends Model<EmployeeExperienceAttributes, EmployeeExperienceCreationAttributes>
  implements EmployeeExperienceAttributes
{
  public id!: number;
  public employee_id!: number;
  public company_name!: string;
  public position!: string;
  public from_date!: Date;
  public to_date!: Date | null;
  public is_deleted!: boolean;
  public employee_code!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeExperience.init(
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
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    from_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    to_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    employee_code: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employee_experiences",
    timestamps: true,
  }
);

export default EmployeeExperience;