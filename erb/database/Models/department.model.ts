import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface DepartmentAttributes {
  id: number;
  parent_id?: number;
  name: string;
  type: string;
  create_at:Date,
  created_by: number;
  isActive: boolean;
  is_deleted: boolean;
}

interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, "id" | "isActive" | "is_deleted"> {}

class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public id!: number;
  public parent_id!: number;
  public name!: string;
  public type!: string;
  public create_at!:Date;
  public created_by!: number;
  public isActive!: boolean;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    create_at:{
    type: DataTypes.DATE,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelize, // instance بتاعك
    tableName: "departments",
    timestamps: true,
  }
);

export default Department;