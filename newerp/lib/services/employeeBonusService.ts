import { createCrudService } from './createCrudService';
import type { EmployeeBonus } from './entities';

const employeeBonusService = createCrudService<EmployeeBonus>('/employeeBonus');

export default employeeBonusService;
export { employeeBonusService };
