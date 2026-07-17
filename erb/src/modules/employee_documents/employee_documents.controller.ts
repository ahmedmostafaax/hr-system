import { Request, Response, NextFunction } from "express";
import EmployeeDocument from "../../../database/Models/employee_documents";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class EmployeeDocumentLogic {
  async createDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employee_id, doc_name, file_path } = req.body;

      const employee: any = await checkItemFound.checkItem(employee_id, Employee);

      const document = await EmployeeDocument.create({
        employee_id,
        doc_name,
        file_path,
        uploaded_at: new Date(),
        employee_code: employee.code,
      });

      return res.status(201).json(
        formatResponse(201, "Document created successfully", document)
      );
    } catch (error) {
      next(error);
    }
  }

  async allDocuments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["doc_name", "file_path", "employee_code", "$Employee.full_name$"])
        .sort()
        .fields()
        .pagination();

      const { rows: documents, count: totalItems } =
        await EmployeeDocument.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all documents", documents, {
          page: features.pageNumber,
          limit: features.pageLimit,
          totalItems,
          totalPages,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async singleDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeDocument);

      const document = await EmployeeDocument.findOne({
        where: { id, is_deleted: false },
        include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
      });

      return res.status(200).json(
        formatResponse(200, "success get document", document)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { employee_id, doc_name, file_path } = req.body;

      const document: any = await checkItemFound.checkItem(
        id,
        EmployeeDocument
      );

      if (employee_id && employee_id !== document.employee_id) {
        await checkItemFound.checkItem(employee_id, Employee);
        document.employee_id = employee_id;
      }

      document.doc_name = doc_name ?? document.doc_name;
      document.file_path = file_path ?? document.file_path;
      if (employee_id && employee_id !== document.employee_id) {
        const employee: any = await checkItemFound.checkItem(employee_id, Employee);
        document.employee_code = employee.code;
      }
      await document.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Document updated successfully",
          document
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const document: any = await checkItemFound.checkItem(
        id,
        EmployeeDocument
      );

      await document.destroy();

      return res.status(200).json(
        formatResponse(
          200,
          "Document deleted successfully",
          null
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const employeeDocumentLogic = new EmployeeDocumentLogic();
