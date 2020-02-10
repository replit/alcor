/* global window */

import { Global, Types } from './types';

export default (serialized: Record<number, Types>, global: Global = window) => {
  const m = new Map<number, any>();

  function getHydratedValue(id: number) {
    if (m.has(id)) {
      return m.get(id);
    }

    const o = serialized[id];

    let hydratedVal;
    switch (o.type) {
      case 'boolean':
        hydratedVal = o.value;
        break;

      case 'string':
        hydratedVal = o.value;
        break;

      case 'symbol':
        hydratedVal = Symbol(o.value);
        break;

      case 'number':
        hydratedVal = o.value;
        break;

      case 'bigint':
        hydratedVal = BigInt(o.value);
        break;

      case 'infinity':
        hydratedVal = o.value === '+' ? Infinity : -Infinity;
        break;

      case 'neg0':
        hydratedVal = -0;
        break;

      case 'nan':
        hydratedVal = NaN;
        break;

      case 'undefined':
        hydratedVal = undefined;
        break;

      case 'null':
        hydratedVal = null;
        break;

      case 'date':
        hydratedVal = new Date();
        hydratedVal.setTime(o.value);
        break;

      case 'error': {
        let Ctor: ErrorConstructor = Error;
        const hasCtor = o.value.name in global;
        if (hasCtor) {
          Ctor = (global as any)[o.value.name];
        }

        const err = new Ctor(o.value.message);
        err.stack = o.value.stack;

        if (!hasCtor) {
          err.name = o.value.name;
        }

        hydratedVal = err;
        break;
      }

      case 'regexp':
        hydratedVal = new RegExp(o.value.src, o.value.flags);

        break;

      case 'typedarray':
        hydratedVal =
          typeof global[o.value.ctor] === 'function'
            ? new global[o.value.ctor](o.value.viewArr)
            : o.value.viewArr;

        break;

      case 'arraybuffer': {
        hydratedVal = new ArrayBuffer(o.value.length);
        const view = new Int8Array(hydratedVal);

        view.set(o.value);

        break;
      }

      case 'function': {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const tempFunc = () => {};

        if (typeof o.value.name === 'string') {
          Object.defineProperty(tempFunc, 'name', {
            value: o.value.name,
            writable: false,
          });
        }

        if (typeof o.value.body === 'string') {
          Object.defineProperty(tempFunc, 'body', {
            value: o.value.body,
            writable: false,
          });

          Object.defineProperty(tempFunc, 'toString', {
            value: () => o.value.body,
            writable: false,
          });
        }

        if (typeof o.value.proto === 'string') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          tempFunc.constructor = {
            name: o.value.proto,
          };
        }

        return tempFunc;
      }

      case 'array':
        hydratedVal = [] as Array<any>;

        // Make sure we set it before looping
        // incase children are circular
        m.set(id, hydratedVal);

        for (const childId of o.value) {
          hydratedVal.push(getHydratedValue(childId));
        }

        break;

      case 'object':
        hydratedVal = {} as Record<any, any>;

        // Make sure we set it before looping
        // incase children are circular
        m.set(id, hydratedVal);

        for (const { key, value } of o.value) {
          hydratedVal[getHydratedValue(key)] = getHydratedValue(value);
        }

        break;

      case 'map':
        hydratedVal = new Map() as Map<any, any>;

        // Make sure we set it before looping
        // incase children are circular
        m.set(id, hydratedVal);

        for (const { key, value } of o.value) {
          hydratedVal.set(getHydratedValue(key), getHydratedValue(value));
        }

        break;

      case 'set':
        hydratedVal = new Set() as Set<any>;

        // Make sure we set it before looping
        // incase children are circular
        m.set(id, hydratedVal);

        for (const { value } of o.value) {
          hydratedVal.add(getHydratedValue(value));
        }

        break;

      case 'domnode': {
        const parser = new window.DOMParser();

        const document = parser.parseFromString(o.value, 'application/xml');
        hydratedVal = document.firstChild;

        if (!hydratedVal) {
          break;
        }

        if (hydratedVal instanceof window.Element) {
          hydratedVal.removeAttribute('xmlns');
        }

        break;
      }

      case 'htmlcollection': {
        const root = window.document.createDocumentFragment();

        for (const elId of o.value) {
          const el = getHydratedValue(elId);

          if (el instanceof window.Element) {
            root.appendChild(el);
          }
        }

        hydratedVal = root.children;

        break;
      }

      case 'nodelist': {
        const root = window.document.createDocumentFragment();

        for (const elId of o.value) {
          const el = getHydratedValue(elId);

          if (el instanceof window.Element) {
            root.appendChild(el);
          }
        }

        hydratedVal = root.childNodes;

        break;
      }

      default:
        assertNever(o);
    }

    m.set(id, hydratedVal);

    return hydratedVal;
  }

  return getHydratedValue(0);
};

function assertNever(_x: never): never {
  throw new Error("Didn't expect to get here");
}
