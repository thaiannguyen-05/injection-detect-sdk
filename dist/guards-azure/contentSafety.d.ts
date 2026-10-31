import { HookEventType } from './http';
import type { AzureCreds } from './shieldPrompt';
export declare function contentSafety(ctx: any, p: {
    credentials?: {
        contentSafety: AzureCreds & {
            customHost?: string;
        };
    };
    categories?: string[];
    severity?: number;
    blocklistNames?: string[];
    apiVersion?: string;
    timeout?: number;
}, ev: HookEventType): Promise<{
    error: null;
    verdict: boolean;
    data: any;
} | {
    error: any;
    verdict: boolean;
    data: null;
}>;
