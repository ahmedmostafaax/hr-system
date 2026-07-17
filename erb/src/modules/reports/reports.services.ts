import { Op, Sequelize } from "sequelize";
import PayrollDetail from "../../../database/Models/payroll_details";
import Employee from "../../../database/Models/employee";
import Department from "../../../database/Models/department.model";
import EmployeeAdvanceLoan from "../../../database/Models/employee_loans";
import EmployeeContract from "../../../database/Models/contracts";
import EmployeeExperience from "../../../database/Models/employee_experience";
import LeaveRequest from "../../../database/Models/leave_requests";
import EmployeeAbsence from "../../../database/Models/absences";

class ReportsService {
  /**
   * 1. إجمالي تكلفة الرواتب (Total Payroll Cost)
   * يقوم بتجميع total_earnings و net_salary لكل قسم بناءً على payroll_run_id (لشهر معين)
   * نستخدم Sequelize.fn لحساب المجموع، و group لتجميع النتائج باسم القسم
   */
  async getPayrollCostReport(payroll_run_id: number) {
    const report = await PayrollDetail.findAll({
      where: { payroll_run_id, is_deleted: false },
      attributes: [
        // تجميع تكلفة الرواتب للموظفين داخل القسم
        [Sequelize.fn("SUM", Sequelize.col("PayrollDetail.total_earnings")), "total_earnings"],
        [Sequelize.fn("SUM", Sequelize.col("PayrollDetail.net_salary")), "net_salary"],
      ],
      include: [
        {
          model: Employee,
          attributes: [], // تجاهل خصائص الموظف في النتيجة لضمان التجميع الصحيح
          include: [
            {
              model: Department,
              attributes: ["name"], // إرجاع اسم القسم فقط
            },
          ],
        },
      ],
      // التجميع بناءً على معرّف تشغيل الراتب واسم القسم ومعرفه (لضمان صحة قاعدة بيانات PostgreSQL)
      group: [
        "payroll_run_id",
        "Employee->Department.id",
        "Employee->Department.name"
      ],
      raw: true, // لإرجاع البيانات ككائن JSON نظيف وسهل الاستخدام
    });

    return report;
  }

  /**
   * 2. تقرير السلف (Loans Report)
   * يقوم بحساب إجمالي المبالغ المتبقية لكل موظف عبر طرح amount - paid_amount
   * نستخدم Sequelize.literal لإجراء العملية الحسابية، و group للتجميع برقم واسم الموظف
   */
  async getLoansReport() {
    const report = await EmployeeAdvanceLoan.findAll({
      // نجلب السلف النشطة التي لم تُحذف
      where: { status: "active", is_deleted: false },
      attributes: [
        "employee_id",
        [Sequelize.col("Employee.full_name"), "employee_name"],
        // حساب المبلغ المتبقي (المبلغ الأساسي - المبلغ المدفوع)
        [Sequelize.fn("SUM", Sequelize.literal("amount - paid_amount")), "total_remaining_amount"],
      ],
      include: [
        {
          model: Employee,
          attributes: [],
        },
      ],
      group: ["employee_id", "Employee.id", "Employee.full_name"],
      raw: true,
    });

    return report;
  }

  /**
   * 3. تحليل الخصومات (Deductions Analysis)
   * يقوم بجمع إجمالي خصومات الغياب وخصومات السلف لشهر معين (payroll_run_id)
   * نستخدم Sequelize.fn لجمع الخصومات، و group للتجميع على مستوى الشهر/الراتب
   */
  async getDeductionsAnalysis(payroll_run_id: number) {
    const report = await PayrollDetail.findAll({
      where: { payroll_run_id, is_deleted: false },
      attributes: [
        "payroll_run_id",
        [Sequelize.fn("SUM", Sequelize.col("absence_deduction")), "total_absence_deduction"],
        [Sequelize.fn("SUM", Sequelize.col("loan_deduction")), "total_loan_deduction"],
        [Sequelize.fn("SUM", Sequelize.col("insurance_employee")), "total_insurance_employee"],
      ],
      group: ["payroll_run_id"],
      raw: true,
    });

    const row: any = report?.[0] ?? {};
    const total_absence = parseFloat(row.total_absence_deduction || 0);
    const total_loan = parseFloat(row.total_loan_deduction || 0);
    const total_insurance = parseFloat(row.total_insurance_employee || 0);

    return {
      total_deductions: total_absence + total_loan + total_insurance,
      breakdown: {
        absence_deductions: total_absence,
        loan_deductions: total_loan,
        insurance_deductions: total_insurance,
      },
    };
  }

  /**
   * 4. مؤشرات الأداء الرئيسية (Monthly KPIs)
   * يقوم بحساب عدد الموظفين، نسب الحضور والغياب، ونسب السلف والخصومات
   */
  async getMonthlyKPIs(payroll_run_id: number) {
    const report: any = await PayrollDetail.findOne({
      where: { payroll_run_id, is_deleted: false },
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("employee_id")), "employee_count"],
        [Sequelize.fn("SUM", Sequelize.col("absence_days")), "total_absence_days"],
        [Sequelize.fn("SUM", Sequelize.col("loan_deduction")), "total_loan_deduction"],
        [Sequelize.fn("SUM", Sequelize.col("total_deductions")), "total_deductions"],
        [Sequelize.fn("SUM", Sequelize.col("total_earnings")), "total_earnings"],
        [Sequelize.fn("AVG", Sequelize.col("net_salary")), "average_net_salary"],
      ],
      raw: true,
    });

    if (!report || !report.employee_count) {
      return {
        employee_count: 0,
        attendance_percentage: 0,
        absence_percentage: 0,
        loans_percentage: 0,
        deductions_percentage: 0,
      };
    }

    const employee_count = parseInt(report.employee_count) || 0;
    const total_absence_days = parseFloat(report.total_absence_days) || 0;
    const total_loan_deduction = parseFloat(report.total_loan_deduction) || 0;
    const total_deductions = parseFloat(report.total_deductions) || 0;
    const total_earnings = parseFloat(report.total_earnings) || 0;

    // افتراض أن أيام العمل القياسية هي 26 يوماً (مثلما هو معتمد في النظام)
    const expected_working_days = employee_count * 26;
    
    let absence_percentage = 0;
    let attendance_percentage = 0;
    
    if (expected_working_days > 0) {
      absence_percentage = (total_absence_days / expected_working_days) * 100;
      attendance_percentage = 100 - absence_percentage;
    }

    let loans_percentage = 0;
    let deductions_percentage = 0;
    
    if (total_earnings > 0) {
      loans_percentage = (total_loan_deduction / total_earnings) * 100;
      deductions_percentage = (total_deductions / total_earnings) * 100;
    }

    return {
      employee_count,
      total_employees: employee_count,
      average_net_salary: parseFloat(parseFloat(report.average_net_salary || 0).toFixed(2)),
      total_earnings,
      total_deductions,
      attendance_percentage: parseFloat(attendance_percentage.toFixed(2)),
      absence_percentage: parseFloat(absence_percentage.toFixed(2)),
      loans_percentage: parseFloat(loans_percentage.toFixed(2)),
      deductions_percentage: parseFloat(deductions_percentage.toFixed(2)),
    };
  }

  /**
   * 5. مؤشرات الأداء السنوية أو الشاملة (Yearly KPIs)
   * يقوم بحساب نفس النسب السابقة ولكن على مستوى السنة (كل البيانات المتاحة)
   * بدون الحاجة لتمرير أي داتا (payroll_run_id)
   */
  async getYearlyKPIs() {
    // نستخدم نفس الاستعلام ولكن بدون الفلترة بـ payroll_run_id
    const report: any = await PayrollDetail.findOne({
      where: { is_deleted: false },
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("employee_id")), "employee_count"],
        [Sequelize.fn("SUM", Sequelize.col("absence_days")), "total_absence_days"],
        [Sequelize.fn("SUM", Sequelize.col("loan_deduction")), "total_loan_deduction"],
        [Sequelize.fn("SUM", Sequelize.col("total_deductions")), "total_deductions"],
        [Sequelize.fn("SUM", Sequelize.col("total_earnings")), "total_earnings"],
      ],
      raw: true,
    });

    if (!report || !report.employee_count) {
      return {
        employee_count: 0,
        attendance_percentage: 0,
        absence_percentage: 0,
        loans_percentage: 0,
        deductions_percentage: 0,
      };
    }

    const employee_count = parseInt(report.employee_count) || 0;
    const total_absence_days = parseFloat(report.total_absence_days) || 0;
    const total_loan_deduction = parseFloat(report.total_loan_deduction) || 0;
    const total_deductions = parseFloat(report.total_deductions) || 0;
    const total_earnings = parseFloat(report.total_earnings) || 0;

    // بما أننا نجمع على مستوى السنة (عدة رواتب)، أيام العمل ستكون:
    // إجمالي عدد مسيرات الرواتب للموظفين (والذي يمثله employee_count هنا كعدد السجلات) * 26
    const expected_working_days = employee_count * 26;
    
    let absence_percentage = 0;
    let attendance_percentage = 0;
    
    if (expected_working_days > 0) {
      absence_percentage = (total_absence_days / expected_working_days) * 100;
      attendance_percentage = 100 - absence_percentage;
    }

    let loans_percentage = 0;
    let deductions_percentage = 0;
    
    if (total_earnings > 0) {
      loans_percentage = (total_loan_deduction / total_earnings) * 100;
      deductions_percentage = (total_deductions / total_earnings) * 100;
    }

    return {
      total_records: employee_count,
      attendance_percentage: parseFloat(attendance_percentage.toFixed(2)),
      absence_percentage: parseFloat(absence_percentage.toFixed(2)),
      loans_percentage: parseFloat(loans_percentage.toFixed(2)),
      deductions_percentage: parseFloat(deductions_percentage.toFixed(2)),
    };
  }

  async getHrStats() {
    const baseWhere = { is_deleted: false };

    const [
      totalEmployees,
      activeEmployees,
      ageStats,
      salaryStats,
      genderDist,
      deptDist,
      maritalDist,
      experienceCount,
      tenureStats,
      contractStatusDist,
      pendingLeaves,
      totalAbsences,
    ] = await Promise.all([
      Employee.count({ where: baseWhere }),
      Employee.count({ where: { ...baseWhere, is_active: true } }),
      Employee.findOne({
        where: { ...baseWhere, birth_date: { [Op.not]: null as unknown as Date } },
        attributes: [
          [
            Sequelize.fn(
              "AVG",
              Sequelize.literal(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, "birth_date"))`)
            ),
            "avg_age",
          ],
          [
            Sequelize.fn(
              "MIN",
              Sequelize.literal(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, "birth_date"))`)
            ),
            "min_age",
          ],
          [
            Sequelize.fn(
              "MAX",
              Sequelize.literal(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, "birth_date"))`)
            ),
            "max_age",
          ],
        ],
        raw: true,
      }),
      EmployeeContract.findOne({
        where: { is_deleted: false, status: "active" },
        attributes: [
          [Sequelize.fn("AVG", Sequelize.col("base_salary")), "avg_salary"],
          [Sequelize.fn("MIN", Sequelize.col("base_salary")), "min_salary"],
          [Sequelize.fn("MAX", Sequelize.col("base_salary")), "max_salary"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "active_contracts"],
        ],
        raw: true,
      }),
      Employee.findAll({
        where: baseWhere,
        attributes: [
          "gender",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["gender"],
        raw: true,
      }),
      EmployeeContract.findAll({
        where: { is_deleted: false, status: "active" },
        attributes: [
          [Sequelize.col("Department.name"), "department_name"],
          [Sequelize.fn("COUNT", Sequelize.col("EmployeeContract.id")), "count"],
        ],
        include: [{ model: Department, attributes: [] }],
        group: ["Department.id", "Department.name"],
        raw: true,
      }),
      Employee.findAll({
        where: baseWhere,
        attributes: [
          "marital_status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["marital_status"],
        raw: true,
      }),
      EmployeeExperience.count({ where: { is_deleted: false } }),
      EmployeeContract.findOne({
        where: { is_deleted: false, status: "active", start_date: { [Op.not]: null as unknown as Date } },
        attributes: [
          [
            Sequelize.fn(
              "AVG",
              Sequelize.literal(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, "start_date"))`)
            ),
            "avg_tenure_years",
          ],
        ],
        raw: true,
      }),
      EmployeeContract.findAll({
        where: { is_deleted: false },
        attributes: [
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
      LeaveRequest.count({ where: { is_deleted: false, status: "pending" } }),
      EmployeeAbsence.count({ where: { is_deleted: false } }),
    ]);

    const ageRow: any = ageStats ?? {};
    const salaryRow: any = salaryStats ?? {};
    const tenureRow: any = tenureStats ?? {};

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      average_age: parseFloat(parseFloat(ageRow.avg_age || 0).toFixed(1)),
      min_age: parseInt(ageRow.min_age || 0, 10),
      max_age: parseInt(ageRow.max_age || 0, 10),
      average_salary: parseFloat(parseFloat(salaryRow.avg_salary || 0).toFixed(2)),
      min_salary: parseFloat(parseFloat(salaryRow.min_salary || 0).toFixed(2)),
      max_salary: parseFloat(parseFloat(salaryRow.max_salary || 0).toFixed(2)),
      active_contracts: parseInt(salaryRow.active_contracts || 0, 10),
      average_tenure_years: parseFloat(parseFloat(tenureRow.avg_tenure_years || 0).toFixed(1)),
      experience_records: experienceCount,
      pending_leaves: pendingLeaves,
      total_absences: totalAbsences,
      gender_distribution: genderDist.map((row: any) => ({
        gender: row.gender || "unknown",
        count: parseInt(row.count, 10),
      })),
      department_distribution: deptDist.map((row: any) => ({
        department_name: row.department_name || "غير محدد",
        count: parseInt(row.count, 10),
      })),
      marital_distribution: maritalDist.map((row: any) => ({
        marital_status: row.marital_status || "unknown",
        count: parseInt(row.count, 10),
      })),
      contract_status_distribution: contractStatusDist.map((row: any) => ({
        status: row.status,
        count: parseInt(row.count, 10),
      })),
    };
  }
}

export const reportsService = new ReportsService();
