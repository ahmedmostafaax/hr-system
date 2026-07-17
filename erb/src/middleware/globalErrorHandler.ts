import { AppError } from "../utils/appError";
import { Request, Response, NextFunction } from "express";

class ErrorHandling {
  public handleError(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(`❌ Error: ${err.message}`, err.stack);
    console.error("→ Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error("→ SQL:", err.sql);

    if (err.parent) {
      console.error("→ DB Error Code:", err.parent.code);
      console.error("→ DB Error Detail:", err.parent.detail);
      console.error("→ DB Error Table:", err.parent.table);
      console.error("→ DB Error Constraint:", err.parent.constraint);
      console.error("→ DB Error Schema:", err.parent.schema);
      console.error("→ DB Error Routine:", err.parent.routine);
      console.error("→ DB Error Where:", err.parent.where);
      console.error("→ DB Error Hint:", err.parent.hint);
    }

    let statusCode = err.statusCode || 500;
    let message = "Internal server error";
    let context: any = {};

    if (err.name === "SequelizeUniqueConstraintError") {
      statusCode = 400;
      message = err.parent?.detail || err.errors?.[0]?.message || "Duplicate entry";
      context = {
        table: err.parent?.table,
        constraint: err.parent?.constraint,
        fields: err.fields,
        sql: err.sql,
      };
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      statusCode = 400;
      message = err.parent?.detail || err.original?.detail || "Foreign key constraint violation";
      context = {
        table: err.parent?.table,
        constraint: err.parent?.constraint,
        fields: err.fields,
        value: err.value,
        sql: err.sql,
      };
    }

    if (err.name === "SequelizeValidationError") {
      statusCode = 400;
      message = err.errors?.map((e: any) => e.message).join("; ") || "Validation error";
      context = { details: err.errors?.map((e: any) => ({ field: e.path, value: e.value, type: e.type })) };
    }

    if (err.name === "SequelizeDatabaseError") {
      statusCode = 400;
      message = err.parent?.detail || err.parent?.message || err.message || "Database operation failed";
      context = {
        table: err.parent?.table,
        column: err.parent?.column,
        dataType: err.parent?.dataType,
        constraint: err.parent?.constraint,
        sql: err.sql,
        code: err.parent?.code,
        routine: err.parent?.routine,
      };
    }

    if (err.name === "SequelizeConnectionError" || err.name === "SequelizeConnectionRefusedError") {
      statusCode = 503;
      message = "Database connection failed";
      context = { detail: err.parent?.message };
    }

    if (err.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid token. Please log in again.";
    }

    if (err.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Your token has expired. Please log in again.";
    }

    if (err instanceof AppError) {
      statusCode = err.statusCode;
      message = err.message;
      context = {};
    }

    return res.status(statusCode).json({
      meta: {
        status: statusCode,
        success: false,
      },
      error: {
        message,
        ...(Object.keys(context).length > 0 && { context }),
      },
    });
  }
}

export const errorHandling = new ErrorHandling();
