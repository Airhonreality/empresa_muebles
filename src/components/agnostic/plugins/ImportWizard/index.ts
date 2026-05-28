import { registerParser } from './parsers';
import { csvParser } from './parsers/csv.parser';
import { jsonParser } from './parsers/json.parser';

// 🔌 REGISTRY PATTERN INITIALIZATION (Agnostic Growth Point)
registerParser('text/csv', csvParser);
registerParser('ext/csv', csvParser);
registerParser('application/json', jsonParser);
registerParser('ext/json', jsonParser);

export { ImportWizard } from './ImportWizard';
export type { ImportSession, ImportResult, FieldMapping, ImportMode } from './types';
