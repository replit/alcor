/* global window */

import { Global, Types, typedArrTypes } from './types';

export default (entry: unknown, global: Global = window): Record<number, Types> => {
  const m = new Map<any, number>();
  const heap: Array<Types> = [];

  function encounterFunction(func: Function): number {
    const found = m.get(func);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(func, id);

    const value = {
      name: func.name,
      body: Function.prototype.toString.call(func),
      proto: Object.getPrototypeOf(func).constructor.name,
    };

    heap.push({ type: 'function', value });

    return id;
  }

  function encounterPlainObj(plainObj: Record<any, unknown>): number {
    const found = m.get(plainObj);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(plainObj, id);

    const refArray: Array<{ key: number; value: number }> = [];
    heap.push({ type: 'object', value: refArray });

    for (const key in plainObj) {
      if (Object.prototype.hasOwnProperty.call(plainObj, key)) {
        // Don't serialize the __proto__ for now
        refArray.push({
          key: serializeValue(key),
          value: serializeValue(plainObj[key]),
        });
      }
    }

    return id;
  }

  function encounterArr(arr: Array<unknown>): number {
    const found = m.get(arr);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(arr, id);

    const refArray: Array<number> = [];
    heap.push({ type: 'array', value: refArray });

    for (const v of arr) {
      refArray.push(serializeValue(v));
    }

    return id;
  }

  function encounterSetOrMap(
    map: Set<unknown> | Map<unknown, unknown>,
    type: 'set' | 'map',
  ): number {
    const found = m.get(map);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(map, id);

    const refArray: Array<{ key: number; value: number }> = [];
    heap.push({ type, value: refArray });

    for (const [k, v] of map.entries()) {
      refArray.push({
        key: serializeValue(k),
        value: serializeValue(v),
      });
    }

    return id;
  }

  function encounterDate(date: Date): number {
    const found = m.get(date);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(date, id);

    heap.push({ type: 'date', value: date.getTime() });

    return id;
  }

  function encounterRegex(regex: RegExp): number {
    const found = m.get(regex);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(regex, id);

    const value = {
      src: regex.source,
      flags: '',
    };
    if (regex.global) value.flags += 'g';
    if (regex.ignoreCase) value.flags += 'i';
    if (regex.multiline) value.flags += 'm';

    heap.push({ type: 'regexp', value });

    return id;
  }

  function encounterError(error: Error): number {
    const found = m.get(error);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(error, id);

    const value = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    heap.push({ type: 'error', value });

    return id;
  }

  function encounterArrBuff(buff: ArrayBuffer): number {
    const found = m.get(buff);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(buff, id);

    const view = new Int8Array(buff);
    const value = Array.prototype.slice.call(view);

    heap.push({ type: 'arraybuffer', value });

    return id;
  }

  function encounterTypedArray(view: ArrayBufferView, ctor: typeof typedArrTypes[number]): number {
    const found = m.get(view);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(view, id);

    const value = {
      ctor,
      viewArr: Array.prototype.slice.call(view),
    };

    heap.push({ type: 'typedarray', value });

    return id;
  }

  function encounterSymbol(sym: symbol): number {
    const found = m.get(sym);

    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(sym, id);

    const value = sym.toString().slice(7, -1);

    heap.push({ type: 'symbol', value });

    return id;
  }

  function encounterDOMNode(node: Node): number {
    const found = m.get(node);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(node, id);

    const serializer = new window.XMLSerializer();

    const value = serializer.serializeToString(node);

    heap.push({ type: 'domnode', value });

    return id;
  }

  function encounterNodeList(nodeList: NodeList) {
    const found = m.get(nodeList);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(nodeList, id);

    const refArray: Array<number> = [];

    heap.push({ type: 'nodelist', value: refArray });

    Array.prototype.forEach.call(nodeList, (node: Node) => {
      refArray.push(serializeValue(node));
    });

    return id;
  }

  function encounterHtmlCollection(collection: HTMLCollection) {
    const found = m.get(collection);
    if (found) {
      return found;
    }

    const id = heap.length;
    m.set(collection, id);

    const refArray: Array<number> = [];

    heap.push({ type: 'htmlcollection', value: refArray });

    Array.prototype.forEach.call(collection, (node: Node) => {
      refArray.push(serializeValue(node));
    });

    return id;
  }

  function serializeValue(obj: unknown): number {
    switch (typeof obj) {
      case 'undefined': {
        heap.push({ type: 'undefined', value: '' });

        return heap.length - 1;
      }
      case 'string': {
        heap.push({ type: 'string', value: obj });

        return heap.length - 1;
      }
      case 'number': {
        // eslint-disable-next-line no-self-compare
        if (obj !== obj) {
          // NaN
          heap.push({ type: 'nan', value: '' });
        } else if (obj === global.Infinity) {
          heap.push({ type: 'infinity', value: '+' });
        } else if (obj === -global.Infinity) {
          // Negative infinite
          heap.push({ type: 'infinity', value: '-' });
        } else if (1 / obj === -Infinity) {
          // Negative 0, thanks JS!
          heap.push({ type: 'neg0', value: '' });
        } else {
          heap.push({ type: 'number', value: obj });
        }

        return heap.length - 1;
      }

      case 'boolean': {
        heap.push({ type: 'boolean', value: obj });

        return heap.length - 1;
      }

      case 'bigint':
        heap.push({ type: 'bigint', value: obj.toString() });

        return heap.length - 1;

      case 'symbol':
        return encounterSymbol(obj);

      case 'function':
        return encounterFunction(obj);

      case 'object': {
        if (obj === null) {
          heap.push({ type: 'null', value: '' });

          return heap.length - 1;
        }

        if (obj instanceof global.Map) {
          return encounterSetOrMap(obj, 'map');
        }

        if (obj instanceof global.Set) {
          return encounterSetOrMap(obj, 'set');
        }

        if (obj instanceof global.Date) {
          return encounterDate(obj);
        }

        if (obj instanceof global.RegExp) {
          return encounterRegex(obj);
        }

        if (obj instanceof global.Error) {
          return encounterError(obj);
        }

        if (obj instanceof global.ArrayBuffer) {
          return encounterArrBuff(obj);
        }

        for (const type of typedArrTypes) {
          if (obj instanceof global[type]) {
            return encounterTypedArray(obj, type);
          }
        }

        if (obj instanceof global.Array) {
          return encounterArr(obj);
        }

        if (obj instanceof global.Node) {
          return encounterDOMNode(obj);
        }

        if (obj instanceof global.NodeList) {
          return encounterNodeList(obj);
        }

        if (obj instanceof global.HTMLCollection) {
          return encounterHtmlCollection(obj);
        }

        return encounterPlainObj(obj as Record<any, any>);
      }

      default:
        throw new Error('Unkown type');
    }
  }

  serializeValue(entry);

  const result: Record<number, Types> = {};

  for (let i = 0; i < heap.length; i++) {
    result[i] = heap[i];
  }

  return result;
};
