export interface SDKConfig {
    /** Node 2: trusted hosts for isValidCustomHost (PURE). */
    trustedHosts?: string[];
    /** Node 3/5: deny=true -> block with 446, false -> only report. Default true. */
    denyOnInjection?: boolean;
    /** Node 3-input PURE: regex list -> default.regexMatch (before). */
    inputRegex?: string[];
    /** Node 5-output PURE: blocked words -> default.contains operator=none (after). */
    outputBlockedWords?: string[];
    /** Node 5-output PURE: code formats to flag, e.g. ['SQL']. */
    outputBlockedCodeFormats?: string[];
    /** Node 3-input KEY: Azure Prompt Shields. Enables shieldPrompt. */
    azure?: {
        resourceName: string;
        apiKey: string;
        apiVersion?: string;
        timeout?: number;
    };
    /** Node 5-output KEY: also enable contentSafety + protectedMaterial when azure set. */
    azureOutput?: boolean;
    /** Node 3+5-external KEY: generic vendor (Acuvity/Pillar/Javelin pattern). */
    external?: {
        endpoint: string;
        apiKey: string;
        inputScanners?: string[];
        outputScanners?: string[];
        thresholds?: Record<string, number>;
        timeout?: number;
    };
    /** Offline testing: inject scores instead of calling vendor. */
    externalScores?: Record<string, number>;
    provider?: string;
}
