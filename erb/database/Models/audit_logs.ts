import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from "../db.connection";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT";

interface AuditLogAttributes {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    "id" | "user_id" | "user_name" | "user_role" | "entity_id" | "old_values" | "new_values" | "ip_address" | "created_at"
  > {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: number;
  public user_id!: number | null;
  public user_name!: string | null;
  public user_role!: string | null;
  public action!: AuditAction;
  public entity_type!: string;
  public entity_id!: number | null;
  public old_values!: Record<string, unknown> | null;
  public new_values!: Record<string, unknown> | null;
  public ip_address!: string | null;
  public created_at!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM(
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "APPROVE",
        "REJECT"
      ),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    timestamps: false,
  }
);

export default AuditLog;
