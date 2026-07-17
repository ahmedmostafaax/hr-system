import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface AccountingPeriodAttributes {
  id: number;
  month: number;
  year: number;
  status: "open" | "closed";
  closed_by?: number | null;
  closed_at?: Date | null;
  created_by?: number | null;
  is_deleted: boolean;
}

interface AccountingPeriodCreationAttributes
  extends Optional<
    AccountingPeriodAttributes,
    "id" | "status" | "closed_by" | "closed_at" | "created_by" | "is_deleted"
  > {}

class AccountingPeriod
  extends Model<AccountingPeriodAttributes, AccountingPeriodCreationAttributes>
  implements AccountingPeriodAttributes
{
  public id!: number;
  public month!: number;
  public year!: number;
  public status!: "open" | "closed";
  public closed_by!: number | null;
  public closed_at!: Date | null;
  public created_by!: number | null;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AccountingPeriod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    closed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "accounting_periods",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["month", "year"],
        name: "accounting_periods_month_year_unique",
      },
    ],
  }
);

export default AccountingPeriod;
