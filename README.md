# injection-req-res-sdk — TS/JS only (single source, no monorepo)

Ported from `orca/gateway` per `injection-flow.excalidraw`. TypeScript SDK only.

```
src/
  client.ts config.ts middleware.ts index.ts
  core/ requestValidator.ts hooks.ts hooksTypes.ts        PURE, no key
  guards-default/ regexMatch|contains|containsCode|validUrls  PURE
  guards-azure/ shieldPrompt|contentSafety|protectedMaterial  KEY
  guards-external/ thresholdGuard                             KEY / offline scores
```

## Usage

```bash
npm install
npm run build
npm test
```

```ts
import { InjectionSDK } from 'injection-req-res-sdk';
const sdk = new InjectionSDK({ inputRegex: ['ignore previous instructions'] });
await sdk.scanInput({ messages: [{ role: 'user', content: 'hi' }] });
```

`verdict=false + shouldDeny=true -> 446`. See `examples/ts-usage.ts`.

## CI/CD (dynamic version)

- `push tag vX.Y.Z` → publishes version `X.Y.Z`.
- Manual `Actions > publish > Run workflow > version` → publishes that version.
- Other pushes → dev version `0.0.0-dev.<timestamp>.<sha>`, dry-run only (no publish).
- Requires repo secret `NPM_TOKEN`. Publish uses `--provenance --access public` plus GitHub Release.
