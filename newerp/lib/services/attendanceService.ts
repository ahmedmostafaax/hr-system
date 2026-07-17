import { createCrudService } from './createCrudService';
import type { Attendance } from './entities';

const attendanceService = createCrudService<Attendance>('/attendance');

export default attendanceService;
export { attendanceService };
