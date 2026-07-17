import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface ContractAllowanceAttributes {
  id: number;
  contract_id: number;
  allowance_type_id: number;
  amount: number;
  is_deleted: boolean;
}

interface ContractAllowanceCreationAttributes
  extends Optional<ContractAllowanceAttributes, "id" | "is_deleted"> {}

class ContractAllowance
  extends Model<ContractAllowanceAttributes, ContractAllowanceCreationAttributes>
  implements ContractAllowanceAttributes
{
  public id!: number;
  public contract_id!: number;
  public allowance_type_id!: number;
  public amount!: number;
  public is_deleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractAllowance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    allowance_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "contract_allowances",
    timestamps: true,
  }
);

export default ContractAllowance;



