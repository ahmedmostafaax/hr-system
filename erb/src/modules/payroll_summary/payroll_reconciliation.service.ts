import { sequelize } from "../../../database/db.connection";

export class PayrollReconciliationService {
  /**
   * Rebuilds the payroll summary for a specific employee from the raw transactional data (Source of Truth).
   * This is used when there's an inconsistency, or during a scheduled repair/reconciliation job.
   */
  static async reconcileEmployeeMonth(employee_id: number, month: number, year: number) {
    // We use a powerful SQL query to do all aggregations and update the summary.
    // This avoids fetching data to Node.js and relies purely on PostgreSQL for performance.
    const query = `
      WITH attendance_agg AS (
        SELECT 
          COUNT(id) as attended_days,
          SUM(overtime_hours) as overtime_hours
        FROM attendances 
        WHERE employee_id = :employee_id 
          AND EXTRACT(MONTH FROM check_in) = :month 
          AND EXTRACT(YEAR FROM check_in) = :year
          AND is_deleted = false
      ),
      bonus_agg AS (
        SELECT SUM(amount) as total_bonus
        FROM employee_bonuses
        WHERE employee_id = :employee_id 
          AND month = :month 
          AND year = :year
          AND is_deleted = false
      ),
      deduction_agg AS (
        SELECT SUM(amount) as total_deductions
        FROM employee_bonuses -- assuming deductions are stored similarly or adjust table
        WHERE employee_id = :employee_id 
          AND month = :month 
          AND year = :year
          AND type = 'deduction' -- assuming type indicates deduction, adjust as per schema
          AND is_deleted = false
      ),
      loan_agg AS (
        SELECT SUM(installment_amount) as loan_deductions
        FROM employee_loans
        WHERE employee_id = :employee_id 
          AND EXTRACT(MONTH FROM start_date) <= :month 
          AND is_paid = false -- simple logic, adjust based on actual loan installments schema
          AND is_deleted = false
      )
      -- Insert or update the summary table
      INSERT INTO employee_monthly_payroll_summaries (
        employee_id, month, year, attended_days, overtime_hours, total_bonus, total_deductions, loan_deductions,
        created_at, updated_at
      )
      VALUES (
        :employee_id, :month, :year,
        COALESCE((SELECT attended_days FROM attendance_agg), 0),
        COALESCE((SELECT overtime_hours FROM attendance_agg), 0),
        COALESCE((SELECT total_bonus FROM bonus_agg), 0),
        COALESCE((SELECT total_deductions FROM deduction_agg), 0),
        COALESCE((SELECT loan_deductions FROM loan_agg), 0),
        NOW(), NOW()
      )
      ON CONFLICT (employee_id, month, year)
      DO UPDATE SET 
        attended_days = EXCLUDED.attended_days,
        overtime_hours = EXCLUDED.overtime_hours,
        total_bonus = EXCLUDED.total_bonus,
        total_deductions = EXCLUDED.total_deductions,
        loan_deductions = EXCLUDED.loan_deductions,
        updated_at = NOW();
    `;

    await sequelize.query(query, {
      replacements: { employee_id, month, year },
    });
  }

  /**
   * Reconcile absences based on attendance, holidays, leaves, weekends.
   * Runs as a scheduled job before payroll generation.
   */
  static async reconcileAbsences(month: number, year: number) {
    // This logic handles calculating absences since absence is not a single event
    // but the lack of attendance on a working day.
    
    // Example: Update absence_days = expected_working_days - (attended_days + paid_leave_days + holidays)
    // using a bulk update query for all employees.
    const query = `
      -- Placeholder for complex absence reconciliation query
      -- In a real scenario, this would join a calendar table or generate_series with the schedule
      UPDATE employee_monthly_payroll_summaries
      SET absence_days = GREATEST(0, 30 - (attended_days + paid_leave_days)) -- simplified 30 days assumption
      WHERE month = :month AND year = :year;
    `;

    await sequelize.query(query, {
      replacements: { month, year },
    });
  }
}
