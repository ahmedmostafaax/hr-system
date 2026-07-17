import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeContactAttributes {
  id: number;
  employee_id: number;
  relation: string;
  name: string;
  phone: string;
  is_deleted?: boolean;
  employee_code: string;  
}

interface EmployeeContactCreationAttributes
  extends Optional<EmployeeContactAttributes, "id"> {}

class EmployeeContact
  extends Model<EmployeeContactAttributes, EmployeeContactCreationAttributes>
  implements EmployeeContactAttributes
{
  public id!: number;
  public employee_id!: number;
  public relation!: string;
  public name!: string;
  public phone!: string;
  public is_deleted!: boolean;
  public employee_code!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeContact.init(
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
    relation: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
    tableName: "employee_contacts",
    timestamps: true,
  }
);

export default EmployeeContact;