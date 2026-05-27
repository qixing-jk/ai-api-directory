import { DomainPolicyError, domainPolicyErrorCode } from "../errors";

export type UrlPolicyResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export type PublicSourceUrlOptions = {
  rejectQueryAndHash?: boolean;
};

export const urlPolicyViolationReason = {
  absoluteUrlRequired: "Public source URL must be an absolute URL",
  unsupportedProtocol: "Public source URL must use http or https",
  credentialsForbidden: "Public source URL must not include credentials",
  queryOrHashForbidden:
    "Public source URL must not include query strings or hashes",
  privateHostForbidden: "Observation URL host must be public",
  unsafePublicPath: "Public source URL path is not public-safe",
} as const;

const unsafePathPatterns = [
  /(^|\/)(user|users|account|accounts|profile|profiles|dashboard|admin)(\/|$)/i,
  /(^|\/)(token|tokens|key|keys|secret|secrets)(\/|$)/i,
  /(^|\/)(sk-[a-z0-9_-]+)/i,
  /(^|\/)(Bearer%20|Bearer-)/i,
];

const percentEncodedPathPattern = /%[0-9a-f]{2}/i;

function parseIpv4Address(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) return Number.NaN;
    const octet = Number(part);
    return octet >= 0 && octet <= 255 ? octet : Number.NaN;
  });

  return octets.every((octet) => Number.isInteger(octet)) ? octets : null;
}

function isPrivateIpv4Address(hostname: string): boolean {
  const octets = parseIpv4Address(hostname);
  if (!octets) return false;

  return isPrivateIpv4Octets(octets);
}

function isPrivateIpv4Octets(octets: readonly number[]): boolean {
  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function parseIpv4MappedIpv6Octets(hostname: string): number[] | null {
  const normalizedHost = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const mappedIpv4Prefix = "::ffff:";
  if (!normalizedHost.startsWith(mappedIpv4Prefix)) return null;

  const mappedAddress = normalizedHost.slice(mappedIpv4Prefix.length);
  const dottedAddress = parseIpv4Address(mappedAddress);
  if (dottedAddress) return dottedAddress;

  const parts = mappedAddress.split(":").filter(Boolean);
  if (parts.length !== 2) return null;

  const [high, low] = parts.map((part) => Number.parseInt(part, 16));
  if (
    !Number.isInteger(high) ||
    !Number.isInteger(low) ||
    high < 0 ||
    high > 0xffff ||
    low < 0 ||
    low > 0xffff
  ) {
    return null;
  }

  return [high >> 8, high & 0xff, low >> 8, low & 0xff];
}

function parseIpv6FirstHextet(normalizedHost: string): number | null {
  const firstHextetRaw = normalizedHost.split(":")[0];
  if (!firstHextetRaw) return null;

  const firstHextet = Number.parseInt(firstHextetRaw, 16);
  return Number.isInteger(firstHextet) &&
    firstHextet >= 0 &&
    firstHextet <= 0xffff
    ? firstHextet
    : null;
}

function isPrivateIpv6Address(hostname: string): boolean {
  const normalizedHost = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!normalizedHost.includes(":")) return false;

  const mappedIpv4Octets = parseIpv4MappedIpv6Octets(normalizedHost);
  if (mappedIpv4Octets) {
    return isPrivateIpv4Octets(mappedIpv4Octets);
  }

  const firstHextet = parseIpv6FirstHextet(normalizedHost);
  const isUniqueLocal = firstHextet !== null && (firstHextet & 0xfe00) === 0xfc00;
  const isLinkLocal = firstHextet !== null && (firstHextet & 0xffc0) === 0xfe80;

  return (
    normalizedHost === "::1" ||
    isUniqueLocal ||
    isLinkLocal
  );
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().replace(/\.$/, "");

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "internal" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost.endsWith(".local") ||
    normalizedHost.endsWith(".internal") ||
    isPrivateIpv4Address(normalizedHost) ||
    isPrivateIpv6Address(normalizedHost)
  );
}

function assertPublicHost(hostname: string): void {
  if (!isPrivateOrLocalHost(hostname)) return;

  throw new DomainPolicyError(
    domainPolicyErrorCode.privacyViolation,
    urlPolicyViolationReason.privateHostForbidden,
  );
}

function parseHttpUrl(rawUrl: string): URL {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.absoluteUrlRequired,
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.unsupportedProtocol,
    );
  }

  if (url.username || url.password) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.credentialsForbidden,
    );
  }

  assertPublicHost(url.hostname);

  return url;
}

function stripTrailingSlash(pathname: string): string {
  if (pathname === "/" || pathname === "") return "";
  return pathname.replace(/\/+$/, "");
}

function assertPublicSafePath(pathname: string): void {
  const normalizedPath = stripTrailingSlash(pathname);
  if (!normalizedPath) return;

  if (percentEncodedPathPattern.test(normalizedPath)) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.unsafePublicPath,
    );
  }

  if (unsafePathPatterns.some((pattern) => pattern.test(normalizedPath))) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.unsafePublicPath,
    );
  }
}

export function normalizeUrlToOrigin(rawUrl: string): string {
  const url = parseHttpUrl(rawUrl);
  return url.origin;
}

function assertNoQueryOrHash(url: URL): void {
  if (!url.search && !url.hash) return;

  throw new DomainPolicyError(
    domainPolicyErrorCode.privacyViolation,
    urlPolicyViolationReason.queryOrHashForbidden,
  );
}

export function normalizePublicSourceUrl(
  rawUrl: string,
  options: PublicSourceUrlOptions = {},
): string {
  const url = parseHttpUrl(rawUrl);
  if (options.rejectQueryAndHash) {
    assertNoQueryOrHash(url);
  }

  assertPublicSafePath(url.pathname);

  return `${url.origin}${stripTrailingSlash(url.pathname)}`;
}

export function validatePublicSourceUrl(
  rawUrl: string,
  options: PublicSourceUrlOptions = {},
): UrlPolicyResult {
  try {
    return { ok: true, value: normalizePublicSourceUrl(rawUrl, options) };
  } catch (error) {
    if (error instanceof DomainPolicyError) {
      return { ok: false, reason: error.message };
    }

    throw error;
  }
}
