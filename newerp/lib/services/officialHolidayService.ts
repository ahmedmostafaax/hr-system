import { createCrudService } from './createCrudService';
import type { OfficialHoliday } from './entities';

const officialHolidayService = createCrudService<OfficialHoliday>('/officialHoliday');

export default officialHolidayService;
export { officialHolidayService };
