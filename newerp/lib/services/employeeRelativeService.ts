import { createCrudService } from './createCrudService';
import type { EmployeeRelative } from './entities';

const employeeRelativeService = createCrudService<EmployeeRelative>('/employeeRelative');

export default employeeRelativeService;
export { employeeRelativeService };
