import { createCrudService } from './createCrudService';
import type { EmployeeLoan } from './entities';

const employeeLoanService = createCrudService<EmployeeLoan>('/employeeLoan');

export default employeeLoanService;
export { employeeLoanService };
