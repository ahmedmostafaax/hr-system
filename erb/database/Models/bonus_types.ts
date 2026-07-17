import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface BonusTypeAttributes {
  id: number;
  name: string;
  payment_type: "cash" | "deferred";
  default_amount: number | null;
  editable_amount: boolean;
  is_deleted: boolean;
}

interface BonusTypeCreationAttributes
  extends Optional<
    BonusTypeAttributes,
    "id" | "default_amount" | "editable_amount" | "is_deleted"
  > {}

class BonusType
  extends Model<BonusTypeAttributes, BonusTypeCreationAttributes>
  implements BonusTypeAttributes
{
  public id!: number;
  public name!: string;
  public payment_type!: "cash" | "deferred";
  public default_amount!: number | null;
  public editable_amount!: boolean;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BonusType.init(
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
    payment_type: {
      type: DataTypes.ENUM("cash", "deferred"),
      allowNull: false,
    },
    default_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    editable_amount: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "bonus_types",
    timestamps: true,
  }
);

export default BonusType;