import {
  DataTypes,
  Model,
  Optional,
} from "sequelize";
import {sequelize} from "../db.connection";
import bcrypt from "bcrypt";


export interface UserAttributes {
  id: number;
  name: string;
  email?: string;
  password: string;
  isActive: boolean;
  isBlock: boolean;
  is_deleted: boolean;
  role: "SUPER-ADMIN"| "ADMIN"| "HR" | "ACCOUNTING" | "EMPLOYEE";
  phoneNumber?: string;
  uniqueCode?:number;
  code?: string;
  employee_id?: number;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  resetCode?: string;
  passwordResetTokenExpire?: Date;
  force_reset_password?: boolean;
}


interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "isActive"
    | "isBlock"
    | "is_deleted"
    | "role"
    | "force_reset_password"
    | "employee_id"
  > {}

/**
 * 3. Model Class
 */
class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public isActive!: boolean;
  public isBlock!: boolean;
  public is_deleted!: boolean;
  public confirmEmail!: boolean;
  public role!: "SUPER-ADMIN"| "ADMIN"| "HR" | "ACCOUNTING" | "EMPLOYEE";
  public phoneNumber?: string;
  public employee_id?: number;
  public code?: string;
  public uniqueCode?:number;
  public passwordChangedAt?: Date;
  public passwordResetToken?: string;
  public resetCode?: string;
  public passwordResetTokenExpire?: Date;
  public force_reset_password!: boolean;
}


User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    uniqueCode:{
      type:DataTypes.INTEGER
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    isBlock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    confirmEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    role: {
      type: DataTypes.ENUM("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING", "EMPLOYEE"),
      defaultValue: "HR",
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      references: { model: "employees", key: "id" },
    },

    phoneNumber: {
      type: DataTypes.STRING,
    },

    code: {
      type: DataTypes.STRING,
    },

    passwordChangedAt: {
      type: DataTypes.DATE,
    },

    passwordResetToken: {
      type: DataTypes.STRING,
    },

    resetCode: {
      type: DataTypes.STRING,
    },

    passwordResetTokenExpire: {
      type: DataTypes.DATE,
    },

    force_reset_password: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,

    indexes: [
      { fields: ["createdAt"] },
      { fields: ["is_deleted", "isBlock"] },
      { fields: ["role"] },
      { fields: ["name"] },
    ],

    hooks: {
      beforeCreate: async (user: any) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 8);
        }
      },

      // beforeUpdate: async (user: any) => {
      //   if (user.password) {
      //     user.password = await bcrypt.hash(user.password, 8);
      //   }
      // },
    },
  }
);

export default User;
