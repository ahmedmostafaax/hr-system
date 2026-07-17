import { Transaction } from "sequelize";
import { AppError } from "../utils/appError";

class CheckItemFound {
  async checkItem(
    id: any,
    model: any,
    options?: { transaction?: Transaction }
  ): Promise<any> {
    const parsedId = Number.parseInt(String(id), 10);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      throw new AppError("Invalid id", 400);
    }

    const where: Record<string, unknown> = { id: parsedId };

    if (model.rawAttributes?.is_deleted != null) {
      where.is_deleted = false;
    }

    const item = await model.findOne({ where, ...options });

    if (!item) {
      throw new AppError(`${model.name} not found`, 404);
    }

    return item;
  }
}

export const checkItemFound = new CheckItemFound();
