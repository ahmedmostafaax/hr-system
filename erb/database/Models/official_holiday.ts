import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface HolidayAttributes {
  id: number;
  name: string;
  start_date: Date;
  days_count: number;
  is_deleted:boolean
}

interface HolidayCreationAttributes
  extends Optional<HolidayAttributes, "id" | "days_count" | "is_deleted"> {}

class Holiday
  extends Model<HolidayAttributes, HolidayCreationAttributes>
  implements HolidayAttributes
{
  public id!: number;
  public name!: string;
  public start_date!: Date;
  public days_count!: number;
  public is_deleted!:boolean
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Holiday.init(
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    days_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_deleted:{
      type:DataTypes.BOOLEAN,
      defaultValue:false
    }
  },
  {
    sequelize,
    tableName: "holidays",
    timestamps: true,
  }
);

export default Holiday;