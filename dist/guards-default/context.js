"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = getText;
function reqPart(json, requestType) {
    if (!json)
        return [];
    if (requestType === 'chatComplete' || requestType === 'messages') {
        const last = json.messages?.[json.messages.length - 1];
        if (!last)
            return [];
        const c = last.content;
        return Array.isArray(c) ? c.map((x) => x.text ?? '') : [String(c ?? '')];
    }
    if (requestType === 'complete')
        return Array.isArray(json.prompt) ? json.prompt : [String(json.prompt ?? '')];
    if (requestType === 'embed')
        return Array.isArray(json.input) ? json.input : [String(json.input ?? '')];
    return [];
}
function resPart(json, requestType) {
    if (!json)
        return [];
    if (requestType === 'chatComplete')
        return [String(json.choices?.[0]?.message?.content ?? json.choices?.[0]?.message?.content?.text ?? '')];
    if (requestType === 'complete')
        return [String(json.choices?.[0]?.text ?? '')];
    if (requestType === 'messages')
        return (json.content ?? []).map((x) => x.text ?? '');
    return [];
}
function getText(ctx, ev) {
    const arr = ev === 'beforeRequestHook' ? reqPart(ctx.request?.json, ctx.requestType) : resPart(ctx.response?.json, ctx.requestType);
    return arr.filter(Boolean).join('\n');
}
