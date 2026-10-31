export declare const VALIDATION_PATTERNS: {
    CONTROL_CHARS: RegExp;
    SUSPICIOUS_CHARS: RegExp;
    DIGITS_1_3: RegExp;
    DIGITS_1_10: RegExp;
    DIGITS_ONLY: RegExp;
    HEX_IP: RegExp;
    ALTERNATIVE_IP_PART: RegExp;
    IPV6_MAPPED_IPV4: RegExp;
    IPV6_EMBEDDED_IPV4: RegExp;
    HOMOGRAPH_ATTACK: RegExp;
};
/**
 * PURE — no API key. Mirrors gateway isValidCustomHost().
 * trustedHosts: default ['localhost','127.0.0.1','::1','host.docker.internal']
 */
export declare function isValidCustomHost(customHost: string, trustedHosts?: Set<string>): boolean;
/** Minimal header/config check (gateway requestValidator core, minus hono). */
export declare function validateRequestHeaders(headers: Record<string, string>): {
    ok: boolean;
    message?: string;
};
