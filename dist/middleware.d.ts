import type { InjectionSDK } from './client';
export declare function expressMiddleware(sdk: InjectionSDK): (req: any, _res: any, next: any) => Promise<any>;
export declare const honoMiddleware: typeof expressMiddleware;
