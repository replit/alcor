# Alcor

[![Edit on Repl.it](https://replit.com/badge/github/replit/alcor)](https://replit.com/new/github/replit/alcor)

Serialize and hydrate complex javascript objects. Like `JSON.stringify` and `JSON.parse` but better.

# Why do you need this?

This library was used at Replit to render a rich JavaScript console across network and postMessage boundaries,
within user-space.

# How is it better?

By better I mean it can handle way more things than JSON.stringify + retain metadata:

- Basic stuff `JSON.stringify` handles properly
  - `String`.
  - `Number`
  - `Boolean`
  - `null`
  - `Object`
  - `Array`
- Cycles `x = {}; x.x = x;`
- Retains object references e.g. `x = {}; y = [x, x];`.
  - In JSON.stringify you don't know if `x` is the same object
  - This has a nice side-effect of being more compact in certain cases, even for primitives.
- `Map`
- `Set`
- `Date`
- `function`
- `RegExp`
- `Error`
- `ArrayBuffer`
- `Int8Array`
- `Uint8Array`
- `Uint8ClampedArray`
- `Int16Array`
- `Uint16Array`
- `Int32Array`
- `Uint32Array`
- `Float32Array`
- `Float64Array`
- `Symbol`
- `undefined`
- `NaN`
- `Infinity`
- `-Infinity`
- `-0`
- `BigInt`
- `Node` (browser only)
- `NodeList` (browser only)
- `HTMLCollection` (browser only)

Missing, feel free to send PR, some of these may be impossible to detect in user-space without bad side-effects 🤷

- `Generator`
- `AsyncGenerator`
- `SharedArrayBuffer`
- `DataView`
- `Proxy`
- `WeakSet`
- `WeakMap`
- More DOM/Web data structures
- I would also like to add is a custom serializer for custom classes and prototypes.

Also this need to add some tests :)

# Example Usage

`npm install @replit/aclor`

Server

```typescript
import vm from 'node:vm';
import { preserve } from `@replit/alcor`;
import { server } from './server';
import contexts from './models/context';

server.get('/eval', async (req, res) => {
  const { code } = req.body;

  const context = await contexts.get(req.sessionId);

  const result = vm.runInNewContext(code, context);

  const serialized = preserve(result, context);

  res.json(serialized);
});
```

Client

```tsx
import { ObjectInspector } from 'react-inspector';
import { revive } from '@replit/alcor';
import { getJSON } from './lib/http';

function Eval(code: string) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    getJSON('/eval', { body: { code } })
      .then((res) => setResult(revive(res)));
  }, [code]);

  if (!result) {
    return <div>waiting for result</div>;
  }

  return <ObjectInspector data={result} />;
}
```

# Security

I have not pen tested this heavily since it was meant to be used in sandboxed contexts.

You can also avoid using `revive` on the frontend (or your non-sandboxed environment) and build an object viewer
that understands the serialized format which is a simple heap of types in `src/types` with the root starting at `0`.

# WTF does Alcor mean

[Alcor is a cryonics foundation](https://en.wikipedia.org/wiki/Alcor_Life_Extension_Foundation)
