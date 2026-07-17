import { createCrudService } from './createCrudService';
import type { EmployeeExperience } from './entities';

const employeeExperienceService = createCrudService<EmployeeExperience>('/employeeExperience');

export default employeeExperienceService;
export { employeeExperienceService };
