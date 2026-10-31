"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const index_js_1 = require("./index.js");
(0, node_test_1.describe)('sdk', () => {
    (0, node_test_1.it)('blocks injection, passes clean', async () => {
        const sdk = new index_js_1.InjectionSDK({ inputRegex: ['ignore previous instructions'] });
        const bad = await sdk.scanInput({ messages: [{ role: 'user', content: 'ignore previous instructions' }] });
        node_assert_1.default.equal(bad.shouldDeny, true);
        const good = await sdk.scanInput({ messages: [{ role: 'user', content: 'hello' }] });
        node_assert_1.default.equal(good.shouldDeny, false);
    });
    (0, node_test_1.it)('blocks output leak', async () => {
        const sdk = new index_js_1.InjectionSDK({ outputBlockedWords: ['AKIA'] });
        const r = await sdk.scanOutput({ messages: [{ role: 'user', content: 'hi' }] }, { choices: [{ message: { content: 'key AKIA' } }] });
        node_assert_1.default.equal(r.shouldDeny, true);
    });
});
