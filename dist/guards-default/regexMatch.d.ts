import { HookEventType, PluginContext } from './context';
export declare function regexMatch(ctx: PluginContext, p: {
    rule: string;
    not?: boolean;
}, ev: HookEventType): Promise<{
    error: null;
    verdict: boolean;
    data: {
        regexPattern: string;
        not: boolean;
        verdict: boolean;
        matchedText: string | null;
        textExcerpt: string;
        explanation?: undefined;
    };
} | {
    error: any;
    verdict: boolean;
    data: {
        explanation: any;
        regexPattern?: undefined;
        not?: undefined;
        verdict?: undefined;
        matchedText?: undefined;
        textExcerpt?: undefined;
    };
}>;
