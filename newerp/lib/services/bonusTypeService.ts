import { createCrudService } from './createCrudService';
import type { BonusType } from './entities';

const bonusTypeService = createCrudService<BonusType>('/bonusType');

export default bonusTypeService;
export { bonusTypeService };
