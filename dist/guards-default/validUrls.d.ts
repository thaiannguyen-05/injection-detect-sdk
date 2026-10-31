import { HookEventType, PluginContext } from './context';
export declare function validUrls(ctx: PluginContext, p: {
    onlyDNS?: boolean;
    not?: boolean;
}, ev: HookEventType): Promise<{
    error: null;
    verdict: boolean;
    data: {
        urls: never[];
        results?: undefined;
        explanation?: undefined;
    };
} | {
    error: null;
    verdict: boolean;
    data: {
        results: {
            url: string;
            isValid: boolean;
        }[];
        urls?: undefined;
        explanation?: undefined;
    };
} | {
    error: any;
    verdict: boolean;
    data: {
        explanation: any;
        urls?: undefined;
        results?: undefined;
    };
}>;
