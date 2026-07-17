import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Request, Response, NextFunction } from "express";
import User from "../../../database/Models/user.model";
import { AppError } from "../../utils/appError";
import dotenv from "dotenv";
import { sendEmail } from "../../service/email/sendEmail";
import { formatResponse } from "../../utils/responseFormatter";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";

dotenv.config();

class Auth {
  async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return next(
          new AppError(
            "Please provide email or phone number and password.",
            400
          )
        );
      }

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /^01[0125][0-9]{8}$/.test(identifier);

      if (!isEmail && !isPhone) {
        return next(
          new AppError("Invalid email or phone number format.", 400)
        );
      }

      const whereCondition = isEmail
        ? { email: identifier }
        : { phoneNumber: identifier };

      const userData: any = await User.findOne({ where: whereCondition });

      if (!userData) {
        return next(
          new AppError("Incorrect email, phone number, or password.", 401)
        );
      }

      const isMatch = await bcrypt.compare(password, userData.password);
      if (!isMatch) {
        return next(
          new AppError("Incorrect email, phone number, or password.", 401)
        );
      }

      if (!userData.isActive) {
        return next(new AppError("Your account is disabled", 403));
      }

      const token = jwt.sign(
        {
          userId: userData.id,
          role: userData.role,
          name: userData.name,
          isActive: userData.isActive,
          uniqueCode: userData.uniqueCode,
          employee_id: userData.employee_id ?? null,
        },
        process.env.JWT_KEY as string || "token",
        { expiresIn: "7d" }
      );

      const userPayload = {
        id: userData.id,
        name: userData.name,
        role: userData.role,
        employee_id: userData.employee_id ?? undefined,
        force_reset_password: !!userData.force_reset_password,
      };

      const responseData: Record<string, unknown> = {
        token,
        user: userPayload,
      };

      if (userData.force_reset_password) {
        responseData.force_reset_password = true;
      }

      res.status(200).json(
        formatResponse(
          200,
          userData.force_reset_password
            ? "Login successful — password reset required"
            : "Logged in successfully",
          responseData
        )
      );

      await auditFromRequest(req, {
        action: "LOGIN",
        entityType: "User",
        entityId: userData.id,
        userId: userData.id,
        userName: userData.name,
        userRole: userData.role,
        newValues: { id: userData.id, name: userData.name, role: userData.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async protectedRoutes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new AppError("Please login first to access this route", 401)
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_KEY as string || "token"
      ) as JwtPayload;
    } catch (err) {
      return next(new AppError("Invalid token", 401));
    }

    const user: any = await User.findByPk(decoded.userId);

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (user.passwordChangedAt) {
      const changedTime = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (changedTime > decoded.iat!) {
        return next(
          new AppError("Token is expired, please log in again", 401)
        );
      }
    }

    (req as any).user = user;
    (req as any).userRole = decoded.role;

    next();
  }

  allowedTo(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (roles.includes(user?.role)) {
        return next();
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Auth] Denied ${req.method} ${req.originalUrl} role=${user?.role ?? "unknown"}`
        );
      }

      return next(
        new AppError(
          "You are not allowed to perform this action on this resource",
          403
        )
      );
    };
  }

  /** Allows listed roles, or any user linked to an employee record (self-service portal). */
  allowedToOrLinkedEmployee(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (roles.includes(user?.role) || user?.employee_id) {
        return next();
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Auth] Denied ${req.method} ${req.originalUrl} role=${user?.role ?? "unknown"} employee_id=${user?.employee_id ?? "none"}`
        );
      }

      return next(
        new AppError(
          "You are not allowed to perform this action on this resource",
          403
        )
      );
    };
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: any = await User.findByPk((req as any).user.id);

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      const oldSnapshot = toAuditSnapshot(user);

      const isMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!isMatch) {
        return next(new AppError("Incorrect password", 401));
      }

      const hashedPassword = await bcrypt.hash(req.body.newPassword, 8);

      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      user.force_reset_password = false;

      await user.save();

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          name: user.name,
          isActive: user.isActive,
          uniqueCode: user.uniqueCode,
          employee_id: user.employee_id ?? null,
        },
        process.env.JWT_KEY as string || "token",
        { expiresIn: "1d" }
      );

      res.status(200).json(
        formatResponse(200, "Password changed successfully", {
          token,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            employee_id: user.employee_id ?? undefined,
            force_reset_password: false,
          },
        })
      );

      await auditFromRequest(req, {
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        oldValues: oldSnapshot,
        newValues: { id: user.id, name: user.name, role: user.role, passwordChanged: true },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = (req as any).user;

      await auditFromRequest(req, {
        action: "LOGOUT",
        entityType: "User",
        entityId: user?.id ?? null,
        newValues: { id: user?.id, name: user?.name, role: user?.role },
      });

      res.status(200).json(formatResponse(200, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  async forgetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      const user: any = await User.findOne({ where: { email } });

      if (!user) {
        return next(
          new AppError(
            "There is no account with provided email address",
            404
          )
        );
      }

      const resetCode = crypto.randomInt(100000, 999999).toString();

      user.passwordResetToken = resetCode;
      user.passwordResetTokenExpire = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user.save();

      await sendEmail({
        message: `Your reset code is: ${resetCode}`,
        email,
      });

      res
        .status(200)
        .json(formatResponse(200, "Reset code sent to email"));
    } catch (error) {
      next(error);
    }
  }

  async verifyResetCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: any = await User.findOne({
        where: {
          passwordResetToken: req.body.code,
          passwordResetTokenExpire: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!user) {
        return next(
          new AppError("Invalid or expired reset code", 400)
        );
      }

      user.resetCode = req.body.code;
      await user.save();

      res
        .status(200)
        .json(formatResponse(200, "Code verified successfully"));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: any = await User.findOne({
        where: { email: req.body.email },
      });

      if (!user) {
        return next(
          new AppError(
            "There is no account with provided email address",
            404
          )
        );
      }

      if (!user.resetCode) {
        return next(new AppError("Reset code not verified", 400));
      }

      const hashedPassword = await bcrypt.hash(
        req.body.newPassword,
        8
      );

      user.password = hashedPassword;
      user.resetCode = null;
      user.passwordResetToken = null;
      user.passwordResetTokenExpire = null;
      user.passwordChangedAt = new Date();

      await user.save();

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          name: user.name,
          isActive: user.isActive,
          uniqueCode: user.uniqueCode,
        },
        process.env.JWT_KEY as string || "token",
        { expiresIn: "1d" }
      );

      res.status(200).json(
        formatResponse(200, "Password reset successfully", {
          token,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const auth = new Auth();