import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface AbsenceTypeAttributes {
  id: number;
  name: string;
  deduct_days: number;
  requires_permission: boolean;
  is_deleted:boolean
}

interface AbsenceTypeCreationAttributes
  extends Optional<
    AbsenceTypeAttributes,
    "id" | "requires_permission" | "is_deleted"
  > {}

class AbsenceType
  extends Model<AbsenceTypeAttributes, AbsenceTypeCreationAttributes>
  implements AbsenceTypeAttributes
{
  public id!: number;
  public name!: string;
  public deduct_days!: number;
  public requires_permission!: boolean;
  public   is_deleted!:boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AbsenceType.init(
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
    deduct_days: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
    },
    requires_permission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_deleted:{
        type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    sequelize,
    tableName: "absence_types",
    timestamps: true,
  }
);

export default AbsenceType;