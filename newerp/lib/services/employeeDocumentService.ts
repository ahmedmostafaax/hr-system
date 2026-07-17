import { createCrudService } from './createCrudService';
import type { EmployeeDocument } from './entities';

const employeeDocumentService = createCrudService<EmployeeDocument>('/employeeDocument');

export default employeeDocumentService;
export { employeeDocumentService };
