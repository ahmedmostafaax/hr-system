import { createCrudService } from './createCrudService';
import type { Account } from './entities';

const accountService = createCrudService<Account>('/account');

export default accountService;
export { accountService };
