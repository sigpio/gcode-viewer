import type { ParsedGCode } from '../../utils/readGCode';
import type { GCodeFileRecord } from '../../context/FileStore';

export type ParsedFile = ParsedGCode & {
  readonly meta: Pick<GCodeFileRecord, 'id' | 'name'>;
};
