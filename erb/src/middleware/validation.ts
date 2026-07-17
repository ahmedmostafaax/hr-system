import { AppError } from "../utils/appError";


class ValidationMiddleware {

  validate(schema: any) {
    return (req: any, res: any, next: any) => {
      
      let filter: any = {};

      // Collect data (body + params + query)
      if (req.file || req.files) {
        filter = { ...req.params, ...req.body, ...req.query };
      } else {
        filter = { ...req.params, ...req.body, ...req.query };
      }

      const { error } = schema.validate(filter, { abortEarly: false });

      if (!error) {
        return next();
      }

      const errMsg = error.details.map((val: any) => val.message);

      return next(new AppError(errMsg.join(", "), 400));
    };
  }

}

export const validationMiddleware = new ValidationMiddleware();