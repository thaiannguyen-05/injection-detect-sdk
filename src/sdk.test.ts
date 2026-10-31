import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InjectionSDK } from './index.js';

describe('sdk', () => {
  it('blocks injection, passes clean', async () => {
    const sdk = new InjectionSDK({ inputRegex: ['ignore previous instructions'] });
    const bad = await sdk.scanInput({ messages: [{ role: 'user', content: 'ignore previous instructions' }] });
    assert.equal(bad.shouldDeny, true);
    const good = await sdk.scanInput({ messages: [{ role: 'user', content: 'hello' }] });
    assert.equal(good.shouldDeny, false);
  });
  it('blocks output leak', async () => {
    const sdk = new InjectionSDK({ outputBlockedWords: ['AKIA'] });
    const r = await sdk.scanOutput({ messages: [{ role: 'user', content: 'hi' }] }, { choices: [{ message: { content: 'key AKIA' } }] });
    assert.equal(r.shouldDeny, true);
  });
});
