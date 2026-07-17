import { createCrudService } from './createCrudService';
import type { AllowanceType } from './entities';

const allowanceTypeService = createCrudService<AllowanceType>('/allowanceType');

export default allowanceTypeService;
export { allowanceTypeService };
