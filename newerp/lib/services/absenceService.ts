import { createCrudService } from './createCrudService';
import type { Absence } from './entities';

const absenceService = createCrudService<Absence>('/absence');

export default absenceService;
export { absenceService };
