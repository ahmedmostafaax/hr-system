import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface CustodyTransferAttributes {
  id: number;
  from_employee_id?: number | null;
  to_employee_id: number;
  item_name: string;
  transfer_type: "handover" | "receive" | "transfer";
  transfer_date: Date;
  notes?: string;
  is_deleted: boolean;
}

interface CustodyTransferCreationAttributes
  extends Optional<
    CustodyTransferAttributes,
    "id" | "from_employee_id" | "notes" | "is_deleted"
  > {}

class CustodyTransfer
  extends Model<CustodyTransferAttributes, CustodyTransferCreationAttributes>
  implements CustodyTransferAttributes
{
  public id!: number;
  public from_employee_id!: number | null;
  public to_employee_id!: number;
  public item_name!: string;
  public transfer_type!: "handover" | "receive" | "transfer";
  public transfer_date!: Date;
  public notes!: string;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustodyTransfer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    to_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    transfer_type: {
      type: DataTypes.ENUM("handover", "receive", "transfer"),
      allowNull: false,
    },
    transfer_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "custody_transfers",
    timestamps: true,
  }
);

export default CustodyTransfer;