import { DomainPolicyError, domainPolicyErrorCode } from "../errors";

export type UrlPolicyResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export const urlPolicyViolationReason = {
  absoluteUrlRequired: "Public source URL must be an absolute URL",
  unsupportedProtocol: "Public source URL must use http or https",
  credentialsForbidden: "Public source URL must not include credentials",
  unsafePublicPath: "Public source URL path is not public-safe",
} as const;

const unsafePathPatterns = [
  /(^|\/)(user|users|account|accounts|profile|profiles|dashboard|admin)(\/|$)/i,
  /(^|\/)(token|tokens|key|keys|secret|secrets)(\/|$)/i,
  /(^|\/)(sk-[a-z0-9_-]+)/i,
  /(^|\/)(Bearer%20|Bearer-)/i,
];

const percentEncodedPathPattern = /%[0-9a-f]{2}/i;

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

export function normalizePublicSourceUrl(rawUrl: string): string {
  const url = parseHttpUrl(rawUrl);
  assertPublicSafePath(url.pathname);

  return `${url.origin}${stripTrailingSlash(url.pathname)}`;
}

export function validatePublicSourceUrl(rawUrl: string): UrlPolicyResult {
  try {
    return { ok: true, value: normalizePublicSourceUrl(rawUrl) };
  } catch (error) {
    if (error instanceof DomainPolicyError) {
      return { ok: false, reason: error.message };
    }

    throw error;
  }
}
