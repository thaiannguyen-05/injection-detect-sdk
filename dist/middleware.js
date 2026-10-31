"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.honoMiddleware = void 0;
exports.expressMiddleware = expressMiddleware;
function expressMiddleware(sdk) {
    return async (req, _res, next) => {
        const r = await sdk.scanInput(req.body ?? {}, req.body?.requestType ?? 'chatComplete', req.headers ?? {});
        if (r.shouldDeny)
            return _res.status(446).json({ verdict: false, hook_results: r.results });
        req.injectionScan = r;
        next();
    };
}
exports.honoMiddleware = expressMiddleware;
