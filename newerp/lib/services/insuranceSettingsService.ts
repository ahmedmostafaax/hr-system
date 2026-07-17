import { createCrudService } from './createCrudService';
import type { InsuranceSetting } from './entities';

const insuranceSettingsService = createCrudService<InsuranceSetting>('/insuranceSettings');

export default insuranceSettingsService;
export { insuranceSettingsService };
