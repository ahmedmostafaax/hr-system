import { createCrudService } from './createCrudService';
import type { Custody } from './entities';

const custodyService = createCrudService<Custody>('/custody');

export default custodyService;
export { custodyService };
