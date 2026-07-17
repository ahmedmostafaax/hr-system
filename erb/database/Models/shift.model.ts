import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface ShiftAttributes {
  id: number;
  name: string;
  type: string;
  work_days: object;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  deduct_grace: boolean;
  salary_basis_days: number;
  is_deleted:boolean
}

interface ShiftCreationAttributes
  extends Optional<
    ShiftAttributes,
    "id" | "grace_minutes" | "deduct_grace" | "salary_basis_days" | "is_deleted"
  > {}

class Shift
  extends Model<ShiftAttributes, ShiftCreationAttributes>
  implements ShiftAttributes
{
  public id!: number;
  public name!: string;
  public type!:string ;
  public work_days!: object;
  public start_time!: string;
  public end_time!: string;
  public grace_minutes!: number;
  public deduct_grace!: boolean;
  public salary_basis_days!: number;
  public is_deleted!:boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shift.init(
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    work_days: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    grace_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    deduct_grace: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    salary_basis_days: {
      type: DataTypes.INTEGER,
      defaultValue: 26,
    },
    is_deleted:{
      type:DataTypes.BOOLEAN,
      defaultValue:false
    }
  },
  {
    sequelize,
    tableName: "shifts",
    timestamps: true,
  }
);

export default Shift;