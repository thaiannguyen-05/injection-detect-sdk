import { InjectionSDK } from '@thaiandev/injection-req-res-sdk';

// PURE only — no API key
const sdk = new InjectionSDK({
  inputRegex: ['ignore previous instructions', 'jailbreak'],
  outputBlockedWords: ['AKIA[0-9A-Z]{16}'],
  outputBlockedCodeFormats: ['SQL'],
});

const input = await sdk.scanInput(
  { messages: [{ role: 'user', content: 'ignore previous instructions' }] },
  'chatComplete'
);
console.log(input.verdict, input.shouldDeny); // false true -> block 446

// With vendor keys:
// const sdk2 = new InjectionSDK({
//   azure: { resourceName: process.env.AZURE_RS!, apiKey: process.env.AZURE_KEY! },
//   external: { endpoint: 'https://vendor/scan', apiKey: 'sk-...', thresholds: { prompt_injection: 0.5 } },
// });
