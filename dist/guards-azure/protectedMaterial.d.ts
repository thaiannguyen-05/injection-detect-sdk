import { HookEventType } from './http';
import type { AzureCreds } from './shieldPrompt';
export declare function protectedMaterial(ctx: any, p: {
    credentials?: {
        contentSafety: AzureCreds;
    };
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
