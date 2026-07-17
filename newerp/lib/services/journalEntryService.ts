import { createCrudService } from './createCrudService';
import type { JournalEntry } from './entities';

const journalEntryService = createCrudService<JournalEntry>('/journalEntry');

export default journalEntryService;
export { journalEntryService };
