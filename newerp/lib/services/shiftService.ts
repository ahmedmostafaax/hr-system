import { createCrudService } from './createCrudService';
import type { Shift } from './entities';

const shiftService = createCrudService<Shift>('/shift');

export default shiftService;
export { shiftService };
