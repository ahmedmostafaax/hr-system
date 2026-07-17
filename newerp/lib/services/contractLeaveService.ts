import { createCrudService } from './createCrudService';
import type { ContractLeave } from './entities';

const contractLeaveService = createCrudService<ContractLeave>('/contractLeave');

export default contractLeaveService;
export { contractLeaveService };
