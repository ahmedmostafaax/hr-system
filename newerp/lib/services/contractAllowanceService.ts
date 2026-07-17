import { createCrudService } from './createCrudService';
import type { ContractAllowance } from './entities';

const contractAllowanceService = createCrudService<ContractAllowance>('/contractAllowance');

export default contractAllowanceService;
export { contractAllowanceService };
