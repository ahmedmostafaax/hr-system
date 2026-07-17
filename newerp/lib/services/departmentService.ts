import { createCrudService } from './createCrudService';
import type { Department } from './entities';

const departmentService = createCrudService<Department>('/department');

export default departmentService;
export { departmentService };
