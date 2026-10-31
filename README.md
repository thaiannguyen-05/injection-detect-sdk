# injection-req-res-sdk — TS/JS only (source thường, không monorepo)

Port từ `orca/gateway` theo `injection-flow.excalidraw`. Chỉ giữ SDK TypeScript.

```
src/
  client.ts config.ts middleware.ts index.ts
  core/ requestValidator.ts hooks.ts hooksTypes.ts        PURE, no key
  guards-default/ regexMatch|contains|containsCode|validUrls  PURE
  guards-azure/ shieldPrompt|contentSafety|protectedMaterial  KEY
  guards-external/ thresholdGuard                             KEY / offline scores
```

## Dùng

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

`verdict=false + shouldDeny=true -> 446`. Xem `examples/ts-usage.ts`.
