import type { SDKConfig } from './config';
export type RequestType = 'chatComplete' | 'complete' | 'messages' | 'embed';
export interface ScanResult {
    verdict: boolean;
    shouldDeny: boolean;
    results: any[];
    transformed: boolean;
}
export declare class InjectionSDK {
    private cfg;
    private mgr;
    constructor(cfg?: SDKConfig);
    /** Node 2 PURE */
    validateHost(host: string): boolean;
    validateHeaders(h: Record<string, string>): {
        ok: boolean;
        message?: string;
    };
    private deny;
    private beforeHooks;
    private afterHooks;
    /** Node 3: scan input (beforeRequestHook). params = {messages|prompt|input} */
    scanInput(params: any, requestType?: RequestType, headers?: Record<string, string>): Promise<ScanResult>;
    /** Node 5: scan output (afterRequestHook). */
    scanOutput(reqParams: any, resJson: any, requestType?: RequestType): Promise<ScanResult>;
    /** Full req+res cycle. */
    scan(reqParams: any, resJson: any, requestType?: RequestType): Promise<{
        input: ScanResult;
        output: ScanResult;
    }>;
}
