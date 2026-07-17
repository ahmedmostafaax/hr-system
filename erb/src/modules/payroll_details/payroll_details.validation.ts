// import Joi from "joi";

// class PayrollDetailsValidation {
//   // POST / — single employee
//   generatePayrollDetail = Joi.object({
//     payroll_run_id:   Joi.number().required(),
//     employee_id:      Joi.number().required(),
//     extra_bonus:      Joi.number().min(0).precision(2).optional(),
//     manual_deduction: Joi.number().min(0).precision(2).optional(),
//     notes:            Joi.string().optional().allow(null, ""),
//   });

//   // Param for generate-all and report/:payroll_run_id
//   payrollRunIdParam = Joi.object({
//     payroll_run_id: Joi.number().required(),
//   });

//   // Query for GET /report — must have payroll_run_id OR (month AND year)
//   reportQuery = Joi.object({
//     payroll_run_id: Joi.number().optional(),
//     month: Joi.number().integer().min(1).max(12).optional(),
//     year:  Joi.number().integer().min(2000).max(2100).optional(),
//   }).or("payroll_run_id", "month"); // at least one of them required
// }

// export const payrollDetailsValidation = new PayrollDetailsValidation();
