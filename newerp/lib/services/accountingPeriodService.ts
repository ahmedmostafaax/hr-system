import { createCrudService } from './createCrudService';
import type { AccountingPeriod } from './entities';

const accountingPeriodService = createCrudService<AccountingPeriod>('/accountingPeriod');

export default accountingPeriodService;
export { accountingPeriodService };
