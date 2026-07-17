import { createCrudService } from './createCrudService';
import type { AbsenceType } from './entities';

const absenceTypeService = createCrudService<AbsenceType>('/absenceType');

export default absenceTypeService;
export { absenceTypeService };
