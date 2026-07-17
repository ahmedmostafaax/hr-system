import { createCrudService } from './createCrudService';
import type { AuditLog } from './entities';

const auditLogService = createCrudService<AuditLog>('/auditLog');

export default auditLogService;
export { auditLogService };
