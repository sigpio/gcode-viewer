declare module 'gcode-parser' {
  export type GCodeWord = {
    letter: string;
    value: number;
  };

  export type GCodeCommand = {
    cmd?: string;
    code?: string;
    line?: string;
    words?: GCodeWord[];
    args?: Record<string, number>;
    comments?: string[];
    ln?: number;
    cs?: number;
    err?: boolean;
    [key: string]: unknown;
  };

  export type ParseOptions = {
    batchSize?: number;
    flatten?: boolean;
    lineMode?: 'original' | 'stripped' | 'compact';
  };

  export function parseLine(line: string, options?: ParseOptions): GCodeCommand;
  export function parseStringSync(source: string, options?: ParseOptions): GCodeCommand[];
}
