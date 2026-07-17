import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

interface EmployeeDocumentAttributes {
  id: number;
  employee_id: number;
  doc_name: string;
  file_path: string;
  uploaded_at?: Date;
  is_deleted?: boolean;
  employee_code: string;  
}

interface EmployeeDocumentCreationAttributes
  extends Optional<EmployeeDocumentAttributes, "id" | "uploaded_at"> {}

class EmployeeDocument
  extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes>
  implements EmployeeDocumentAttributes
{
  public id!: number;
  public employee_id!: number;
  public doc_name!: string;
  public file_path!: string;
  public uploaded_at!: Date;
  public is_deleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public employee_code!: string;
}

EmployeeDocument.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doc_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    employee_code: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employee_documents",
    timestamps: true,
  }
);

export default EmployeeDocument;