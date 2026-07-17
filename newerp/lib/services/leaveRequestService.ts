import { createCrudService } from './createCrudService';
import type { LeaveRequest } from './entities';

const leaveRequestService = createCrudService<LeaveRequest>('/leaveRequest');

export default leaveRequestService;
export { leaveRequestService };
