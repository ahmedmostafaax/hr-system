import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

/**
 * Attributes
 */
export interface AccountAttributes {
  id: number;
  name: string;
  code: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_id?: number | null;
  level: number;
  is_posting: boolean;
  description?: string;
  currency: string;
  balance_type: "debit" | "credit";
  is_deleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creation Attributes
 */
export interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | "id"
    | "parent_id"
    | "is_deleted"
    | "level"
    | "is_posting"
    | "description"
    | "currency"
    | "balance_type"
  > {}

/**
 * Model
 */
class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public type!: "asset" | "liability" | "equity" | "revenue" | "expense";
  public parent_id!: number | null;
  public level!: number;
  public is_posting!: boolean;
  public description!: string;
  public currency!: string;
  public balance_type!: "debit" | "credit";
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    type: {
      type: DataTypes.ENUM(
        "asset",
        "liability",
        "equity",
        "revenue",
        "expense"
      ),
      allowNull: false,
    },

    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    is_posting: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: "EGP",
    },

    balance_type: {
      type: DataTypes.ENUM("debit", "credit"),
      allowNull: false,
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "accounts",
    timestamps: true,
  }
);

export default Account;