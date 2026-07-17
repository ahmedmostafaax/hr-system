import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface InsuranceRateAttributes {
  id: number;
  employee_rate: number;
  company_rate: number;
  effective_from: Date;
  is_deleted: boolean;
}

interface InsuranceRateCreationAttributes
  extends Optional<InsuranceRateAttributes, "id" | "is_deleted"> {}

class InsuranceRate
  extends Model<InsuranceRateAttributes, InsuranceRateCreationAttributes>
  implements InsuranceRateAttributes
{
  public id!: number;
  public employee_rate!: number;
  public company_rate!: number;
  public effective_from!: Date;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InsuranceRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    company_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    effective_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "insurance_rates",
    timestamps: true,
  }
);

export default InsuranceRate;