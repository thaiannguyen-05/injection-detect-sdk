import { HookEventType } from './http';
export interface AzureCreds {
    resourceName: string;
    apiKey?: string;
    azureAuthMode?: string;
}
export declare function shieldPrompt(ctx: any, p: {
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
