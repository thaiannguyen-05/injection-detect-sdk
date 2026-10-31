import { HookEventType, PluginContext } from './context';
export declare function containsCode(ctx: PluginContext, p: {
    format: string;
    not?: boolean;
}, ev: HookEventType): Promise<{
    error: null;
    verdict: boolean;
    data: {
        searchedFormat: string;
        foundFormats: string[];
        explanation?: undefined;
    };
} | {
    error: any;
    verdict: boolean;
    data: {
        explanation: any;
        searchedFormat?: undefined;
        foundFormats?: undefined;
    };
}>;
