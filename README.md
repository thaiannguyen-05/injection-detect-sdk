# @thaiandev/injection-req-res-sdk — TS/JS only (single source, no monorepo)

Ported from `orca/gateway` per `injection-flow.excalidraw`. TypeScript SDK only.
Publishes to https://www.npmjs.com/settings/thaiandev/packages as `@thaiandev/injection-req-res-sdk`.

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
npm install @thaiandev/injection-req-res-sdk
```

```ts
import { InjectionSDK } from '@thaiandev/injection-req-res-sdk';
const sdk = new InjectionSDK({ inputRegex: ['ignore previous instructions'] });
await sdk.scanInput({ messages: [{ role: 'user', content: 'hi' }] });
```

`verdict=false + shouldDeny=true -> 446`. See `examples/ts-usage.ts`.

## Local dev

```bash
npm install
npm run build
npm test
```

## Publish auth (fix E401 missing auth)

`npm publish` needs an npm **Automation token** for the `thaiandev` account with
Bypass 2FA + publish permission on `@thaiandev/*`:

1. npmjs.com → avatar → Access Tokens → Generate New Token → **Automation**
   (classic) or Granular (scope `@thaiandev`, packages `injection-req-res-sdk`, read+write).
2. GitHub repo → Settings → Secrets and variables → Actions → New secret:
   Name `NPM_TOKEN`, value = token from step 1.
3. Push tag: `git tag v0.2.0 && git push origin v0.2.0`, or Actions → publish → Run workflow.

Verify locally (do NOT commit the token):

```bash
export NODE_AUTH_TOKEN=npm_xxx
npm whoami --registry https://registry.npmjs.org
npm publish --dry-run
```

## CI/CD (dynamic version)

- `push tag vX.Y.Z` → publishes version `X.Y.Z` with npm tag `latest`.
- Manual `Actions > publish > Run workflow > version + npm_tag` → publishes that version.
- Other pushes → dev version `0.0.0-dev.<timestamp>.<sha>`, dry-run only (no publish).
- Publish uses `--provenance --access public` plus GitHub Release.
