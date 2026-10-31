import { HookEventType, PluginContext } from './context';
export declare function contains(ctx: PluginContext, p: {
    words: string[];
    operator: 'any' | 'all' | 'none';
}, ev: HookEventType): Promise<{
    error: null;
    verdict: boolean;
    data: {
        foundWords: string[];
        missingWords: string[];
        operator: "any" | "all" | "none";
        explanation?: undefined;
    };
} | {
    error: any;
    verdict: boolean;
    data: {
        explanation: any;
        foundWords?: undefined;
        missingWords?: undefined;
        operator?: undefined;
    };
}>;
