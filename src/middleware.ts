// Framework adapters: Express / Hono / Fastify-compatible (req.headers, req.body).
import type { InjectionSDK } from './client';
export function expressMiddleware(sdk: InjectionSDK) {
  return async (req: any, _res: any, next: any) => {
    const r = await sdk.scanInput(req.body ?? {}, req.body?.requestType ?? 'chatComplete', req.headers ?? {});
    if (r.shouldDeny) return _res.status(446).json({ verdict: false, hook_results: r.results });
    (req as any).injectionScan = r;
    next();
  };
}
export const honoMiddleware = expressMiddleware;
