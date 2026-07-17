import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface AllowanceAttributes {
  id: number;
  name: string;
  default_amount: number;
  is_part_of_salary: boolean;
  account_code: string;
  is_deleted:boolean;
}

interface AllowanceCreationAttributes
  extends Optional<
    AllowanceAttributes,
    "id" 
    | "default_amount" 
    | "is_part_of_salary" 
    | "is_deleted"
  > {}

class Allowance
  extends Model<AllowanceAttributes, AllowanceCreationAttributes>
  implements AllowanceAttributes
{
  public id!: number;
  public name!: string;
  public default_amount!: number;
  public is_part_of_salary!: boolean;
  public account_code!: string;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Allowance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    default_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    is_part_of_salary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    account_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    is_deleted:{
        type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    sequelize,
    tableName: "allowances",
    timestamps: true,
  }
);

export default Allowance;