import { createCrudService } from './createCrudService';
import type { Contract } from './entities';

const contractService = createCrudService<Contract>('/contract');

export default contractService;
export { contractService };
