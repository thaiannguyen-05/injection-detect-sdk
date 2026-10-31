// Ported from orca/gateway/src/middlewares/requestValidator/index.ts
// Removed hono dependency — pure functions, no API key.

export const VALIDATION_PATTERNS = {
  CONTROL_CHARS: /[\x00-\x1F\x7F]/,
  SUSPICIOUS_CHARS: /[\s<>{}|\\^`]/,
  DIGITS_1_3: /^\d{1,3}$/,
  DIGITS_1_10: /^\d{1,10}$/,
  DIGITS_ONLY: /^\d+$/,
  HEX_IP: /^0x[0-9a-f]{1,8}$/i,
  ALTERNATIVE_IP_PART: /^0[0-9a-fx]/i,
  IPV6_MAPPED_IPV4: /::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i,
  IPV6_EMBEDDED_IPV4: /::(\d{1,3}(?:\.\d{1,3}){3})$/i,
  HOMOGRAPH_ATTACK: /^[a-z0-9.-]+$/,
};

const DISALLOWED_SCHEMES = ['file://', 'data:', 'gopher:', 'ftp://', 'ftps://'];

const BLOCKED_HOSTS = new Set([
  '0.0.0.0',
  '169.254.169.254',
  'metadata.google.internal',
  'metadata',
  'metadata.azure.com',
  'instance-data',
]);

const BLOCKED_TLDS = [
  '.local', '.localdomain', '.internal', '.intranet', '.lan',
  '.home', '.corp', '.test', '.invalid', '.onion', '.localhost',
];

function ipv4ToInt(ip: string): number {
  const [a, b, c, d] = ip.split('.').map(Number);
  return ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
}
function intToIPv4(num: number): string {
  return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
}
const IPV4_RANGES = {
  PRIVATE: [
    { start: ipv4ToInt('10.0.0.0'), end: ipv4ToInt('10.255.255.255') },
    { start: ipv4ToInt('172.16.0.0'), end: ipv4ToInt('172.31.255.255') },
    { start: ipv4ToInt('192.168.0.0'), end: ipv4ToInt('192.168.255.255') },
  ],
  RESERVED: [
    { start: ipv4ToInt('127.0.0.0'), end: ipv4ToInt('127.255.255.255') },
    { start: ipv4ToInt('169.254.0.0'), end: ipv4ToInt('169.254.255.255') },
    { start: ipv4ToInt('100.64.0.0'), end: ipv4ToInt('100.127.255.255') },
    { start: ipv4ToInt('0.0.0.0'), end: ipv4ToInt('0.255.255.255') },
    { start: ipv4ToInt('224.0.0.0'), end: ipv4ToInt('255.255.255.255') },
  ],
};

function isIPv4(parts: string[]): boolean {
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!VALIDATION_PATTERNS.DIGITS_1_3.test(p)) return false;
    const n = Number(p);
    if (n < 0 || n > 255) return false;
    if (p.length > 1 && p.startsWith('0')) return false;
    return true;
  });
}
function inRanges(ip: string, ranges: { start: number; end: number }[]): boolean {
  const v = ipv4ToInt(ip);
  return ranges.some((r) => v >= r.start && v <= r.end);
}
const isPrivateIPv4 = (ip: string) => inRanges(ip, IPV4_RANGES.PRIVATE);
const isReservedIPv4 = (ip: string) => inRanges(ip, IPV4_RANGES.RESERVED);

function isLocalOrPrivateIPv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::1' || h === '::') return true;
  if (h.startsWith('fc') || h.startsWith('fd')) return true;
  if (h.startsWith('fe80') || h.startsWith('fec0')) return true;
  return false;
}

function isAlternativeIPRepresentation(host: string, parts: string[]): boolean {
  if (VALIDATION_PATTERNS.DIGITS_1_10.test(host)) {
    const n = parseInt(host, 10);
    if (n >= 0 && n <= 0xffffffff) return true; // block all decimal form (gateway behaviour)
  }
  if (VALIDATION_PATTERNS.HEX_IP.test(host)) return true;
  if (parts.length === 4 && parts.some((p) => VALIDATION_PATTERNS.ALTERNATIVE_IP_PART.test(p))) return true;
  if (parts.length >= 2 && parts.length < 4) {
    if (parts.every((p) => VALIDATION_PATTERNS.DIGITS_ONLY.test(p) && Number(p) <= 255)) return true;
  }
  return false;
}

function isValidPort(port: string): boolean {
  const p = parseInt(port, 10);
  return p > 0 && p <= 65535;
}

/**
 * PURE — no API key. Mirrors gateway isValidCustomHost().
 * trustedHosts: default ['localhost','127.0.0.1','::1','host.docker.internal']
 */
export function isValidCustomHost(
  customHost: string,
  trustedHosts: Set<string> = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal'])
): boolean {
  try {
    const value = customHost.trim().toLowerCase();
    if (!value) return false;
    if (VALIDATION_PATTERNS.CONTROL_CHARS.test(customHost)) return false;
    if (value.includes('api.portkey')) return false;
    if (DISALLOWED_SCHEMES.some((s) => value.startsWith(s))) return false;

    const url = new URL(customHost);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (customHost.includes('@')) return false;

    const host = url.hostname;
    if (!host) return false;
    if (host.includes('%')) return false;
    if (VALIDATION_PATTERNS.SUSPICIOUS_CHARS.test(host)) return false;
    if (!VALIDATION_PATTERNS.HOMOGRAPH_ATTACK.test(host)) return false;
    if (host.endsWith('.')) return false;
    const hostParts = host.split('.');
    if (hostParts.length > 10) return false;

    const isTrusted =
      trustedHosts.has(host) || (trustedHosts.has('localhost') && host.endsWith('.localhost'));
    if (isTrusted) {
      if (url.port && !isValidPort(url.port)) return false;
      return true;
    }
    if (BLOCKED_HOSTS.has(host)) return false;
    if (host.startsWith('169.254.169.') || host.startsWith('fd00:ec2::')) return false;
    if (BLOCKED_TLDS.some((t) => host.endsWith(t) && host !== 'localhost')) return false;
    if (isIPv4(hostParts) && (isPrivateIPv4(host) || isReservedIPv4(host))) return false;
    if (isAlternativeIPRepresentation(host, hostParts)) return false;
    if (host.includes(':')) {
      if (isLocalOrPrivateIPv6(host)) return false;
      const m = host.match(VALIDATION_PATTERNS.IPV6_MAPPED_IPV4) || host.match(VALIDATION_PATTERNS.IPV6_EMBEDDED_IPV4);
      if (m && (isPrivateIPv4(m[1]) || isReservedIPv4(m[1]))) return false;
    }
    if (url.port && !isValidPort(url.port)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Minimal header/config check (gateway requestValidator core, minus hono). */
export function validateRequestHeaders(headers: Record<string, string>): { ok: boolean; message?: string } {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const ct = h['content-type'];
  if (ct && !['application/json', 'multipart/form-data'].includes(ct.split(';')[0]) && !ct.startsWith('audio/'))
    return { ok: false, message: 'Invalid content type' };
  if (!h['x-portkey-config'] && !h['x-portkey-provider'])
    return { ok: false, message: 'x-portkey-config or x-portkey-provider required' };
  return { ok: true };
}
