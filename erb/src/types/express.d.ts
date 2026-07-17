import { UserAttributes } from "../../database/Models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
      userRole?: string;
    }
  }
}
