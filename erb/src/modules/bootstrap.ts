import absenceTypeRouter from "./absence_types/absence_types.routes";
import AccountRouter from "./account/account.routes";
import allowanceTypeRouter from "./allowance_types/allowance_types.routes";
import authRouter from "./auth/auth.routes";
import BonusTypesRouter from "./bonus_types/bonus_types.routes";
import departmentRouter from "./department/department.routes";
import InsuranceSettingsRouter from "./insurance_settings/insurance_settings.routes";
import leaveTypesRouter from "./leave_types/leave_types.routes";
import officialHolidayRouter from "./official_holidays/official_holidays.routes";
import shiftRouter from "./shift/shift.routes";
import userRoute from "./user/user.routes"
import employeeRouter from "./employees/employee.routes";
import employeeDocumentRouter from "./employee_documents/employee_documents.routes";
import employeeRelativeRouter from "./employee_relatives/employee_relatives.routes";
import employeeExperienceRouter from "./employee_experience/employee_experience.routes";
import contractRouter from "./contracts/contracts.routes";
import contractAllowancesRouter from "./contract_allowances/contract_allowances.routes";
import contractLeavesRouter from "./contract_leaves/contract_leaves.routes";
import custodyRouter from "./custody/custody.routes";
import employeeLoansRouter from "./employee_loans/employee_loans.routes";
import employeeBonusesRouter from "./employee_bonuses/employee_bonuses.routes";
import absencesRouter from "./absences/absences.routes";
import leaveRequestsRouter from "./leave_requests/leave_requests.routes";
import attendanceRouter from "./attendance/attendance.routes";
import payrollRunsRouter from "./payroll_runs/payroll_runs.routes";
import payrollDetailsRouter from "./payroll_details/payroll_details.routes";
import reportsRouter from "./reports/reports.routes";
import journalEntriesRouter from "./journal_entries/journal_entries.routes";
import accountingPeriodsRouter from "./accounting_periods/accounting_periods.routes";
import auditLogsRouter from "./audit_logs/audit_logs.routes";
import {Express} from 'express';

class Bootstrap {
    public mainBootstrap(app:Express){
        this.initRoutes(app)
    }

    private initRoutes(app:Express){
        app.use("/api/v1/user", userRoute);
        app.use("/api/v1/auth", authRouter);
        app.use("/api/v1/department", departmentRouter);
        app.use("/api/v1/shift", shiftRouter);
        app.use("/api/v1/leaveType", leaveTypesRouter);
        app.use("/api/v1/officialHoliday", officialHolidayRouter);
        app.use("/api/v1/account", AccountRouter);
        app.use("/api/v1/allowanceType", allowanceTypeRouter);
        app.use("/api/v1/absenceType", absenceTypeRouter);
        app.use("/api/v1/bonusType", BonusTypesRouter);
        app.use("/api/v1/insuranceSettings", InsuranceSettingsRouter);
        app.use("/api/v1/employee", employeeRouter);
        app.use("/api/v1/employeeDocument", employeeDocumentRouter);
        app.use("/api/v1/employeeRelative", employeeRelativeRouter);
        app.use("/api/v1/employeeExperience", employeeExperienceRouter);
        app.use("/api/v1/contract", contractRouter);
        app.use("/api/v1/contractAllowance", contractAllowancesRouter);
        app.use("/api/v1/contractLeave", contractLeavesRouter);
        app.use("/api/v1/custody", custodyRouter);
        app.use("/api/v1/employeeLoan", employeeLoansRouter);
        app.use("/api/v1/employeeBonus", employeeBonusesRouter);
        app.use("/api/v1/absence", absencesRouter);
        app.use("/api/v1/leaveRequest", leaveRequestsRouter);
        app.use("/api/v1/attendance", attendanceRouter);
        app.use("/api/v1/payrollRun", payrollRunsRouter);
        app.use("/api/v1/payrollDetail", payrollDetailsRouter);
        app.use("/api/v1/reports", reportsRouter);
        app.use("/api/v1/journalEntry", journalEntriesRouter);
        app.use("/api/v1/accountingPeriod", accountingPeriodsRouter);
        app.use("/api/v1/auditLog", auditLogsRouter);
        







    }
}


export const  bootstrap=new Bootstrap 