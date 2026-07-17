import { createCrudService } from './createCrudService';
import type { LeaveType } from './entities';

const leaveTypeService = createCrudService<LeaveType>('/leaveType');

export default leaveTypeService;
export { leaveTypeService };
