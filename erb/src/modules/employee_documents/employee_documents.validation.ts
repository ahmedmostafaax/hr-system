import Joi from "joi";

class EmployeeDocumentValidation {
   createDocument = Joi.object({
    employee_id: Joi.number().required(),
    doc_name: Joi.string().max(200).required(),
    file_path: Joi.string().max(500).required(),
  });

   updateDocument = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    doc_name: Joi.string().max(200).optional(),
    file_path: Joi.string().max(500).optional(),
  });

   idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeDocumentValidation = new EmployeeDocumentValidation();
