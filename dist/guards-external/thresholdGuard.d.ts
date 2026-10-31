type Ev = 'beforeRequestHook' | 'afterRequestHook';
export interface ThresholdParams {
    scanners: string[];
    thresholds?: Record<string, number>;
    scores?: Record<string, number>;
    credentials?: {
        apiKey?: string;
    };
    endpoint?: string;
    timeout?: number;
    redactCategories?: string[];
}
export declare function thresholdGuard(ctx: any, p: ThresholdParams, ev: Ev): Promise<{
    error: null;
    verdict: boolean;
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted?: undefined;
    };
    transformed?: undefined;
    transformedData?: undefined;
} | {
    error: null;
    verdict: boolean;
    transformed: boolean;
    transformedData: {
        request: {
            json: null;
        };
        response: {
            json: null;
        };
    };
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted: boolean;
    };
} | {
    error: any;
    verdict: boolean;
    data: null;
    transformed?: undefined;
    transformedData?: undefined;
}>;
export declare const pillarScanPrompt: (ctx: any, p: {
    scanners?: string[];
    scores?: Record<string, number>;
}, ev: Ev) => Promise<{
    error: null;
    verdict: boolean;
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted?: undefined;
    };
    transformed?: undefined;
    transformedData?: undefined;
} | {
    error: null;
    verdict: boolean;
    transformed: boolean;
    transformedData: {
        request: {
            json: null;
        };
        response: {
            json: null;
        };
    };
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted: boolean;
    };
} | {
    error: any;
    verdict: boolean;
    data: null;
    transformed?: undefined;
    transformedData?: undefined;
}>;
export declare const acuvityScan: (ctx: any, p: ThresholdParams, ev: Ev) => Promise<{
    error: null;
    verdict: boolean;
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted?: undefined;
    };
    transformed?: undefined;
    transformedData?: undefined;
} | {
    error: null;
    verdict: boolean;
    transformed: boolean;
    transformedData: {
        request: {
            json: null;
        };
        response: {
            json: null;
        };
    };
    data: {
        scores: Record<string, number>;
        hits: string[];
        redacted: boolean;
    };
} | {
    error: any;
    verdict: boolean;
    data: null;
    transformed?: undefined;
    transformedData?: undefined;
}>;
export {};
