/* global globalThis */

export const typedArrTypes = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
] as const;

export type Types =
  | {
      type: 'function';
      value: {
        name: string;
        body: string;
        proto: string;
      };
    }
  | {
      type: 'object';
      value: Array<{ key: number; value: number }>;
    }
  | {
      type: 'array';
      value: Array<number>;
    }
  | {
      type: 'set' | 'map';
      value: Array<{ key: number; value: number }>;
    }
  | {
      type: 'date';
      value: number;
    }
  | {
      type: 'regexp';
      value: {
        src: string;
        flags: string;
      };
    }
  | {
      type: 'error';
      value: {
        name: string;
        message: string;
        stack?: string;
      };
    }
  | {
      type: 'arraybuffer';
      value: Array<number>;
    }
  | {
      type: 'typedarray';
      value: {
        ctor: typeof typedArrTypes[number];
        viewArr: Array<number>;
      };
    }
  | {
      type: 'symbol';
      value: string;
    }
  | { type: 'undefined'; value: '' }
  | { type: 'string'; value: string }
  | { type: 'nan'; value: '' }
  | { type: 'infinity'; value: '+' | '-' }
  | { type: 'neg0'; value: '' }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'bigint'; value: string }
  | { type: 'null'; value: '' }
  | { type: 'domnode'; value: string }
  | { type: 'nodelist'; value: Array<number> }
  | { type: 'htmlcollection'; value: Array<number> };

export type Global = Window & typeof globalThis;
