import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import {
  normalizePublicSourceUrl,
  normalizeUrlToOrigin,
  validatePublicSourceUrl,
} from "./url-policy";

describe("public source URL policy", () => {
  it("normalizes user-observed URLs to origin only", () => {
    expect(
      normalizeUrlToOrigin(
        "https://api.example.com/account/123?token=secret#private",
      ),
    ).toBe("https://api.example.com");
  });

  it("keeps reviewed public paths while removing query strings and hashes by default", () => {
    expect(
      normalizePublicSourceUrl(
        "https://docs.example.com/pricing/openai?utm=ad#table",
      ),
    ).toBe("https://docs.example.com/pricing/openai");
  });

  it("can reject query strings and hashes for observation intake", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/pricing?utm=ad", {
        rejectQueryAndHash: true,
      }),
    ).toThrow("Public source URL must not include query strings or hashes");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/pricing#models", {
        rejectQueryAndHash: true,
      }),
    ).toThrow("Public source URL must not include query strings or hashes");
  });

  it("removes trailing slashes from public source paths except origin", () => {
    expect(normalizePublicSourceUrl("https://docs.example.com/pricing/")).toBe(
      "https://docs.example.com/pricing",
    );
    expect(normalizePublicSourceUrl("https://docs.example.com/")).toBe(
      "https://docs.example.com",
    );
  });

  it("rejects unsupported protocols and credential-bearing URLs", () => {
    expect(() => normalizePublicSourceUrl("ftp://example.com/pricing")).toThrow(
      DomainPolicyError,
    );
    expect(() =>
      normalizePublicSourceUrl("https://user:pass@example.com/pricing"),
    ).toThrow("Public source URL must not include credentials");
  });

  it("rejects non-absolute URLs", () => {
    expect(() => normalizePublicSourceUrl("/pricing/openai")).toThrow(
      "Public source URL must be an absolute URL",
    );
  });

  it("rejects private and local hosts", () => {
    expect(() => normalizeUrlToOrigin("http://localhost:3000/pricing")).toThrow(
      "Observation URL host must be public",
    );
    expect(() => normalizeUrlToOrigin("https://192.168.1.2/pricing")).toThrow(
      "Observation URL host must be public",
    );
    expect(() =>
      normalizePublicSourceUrl("https://admin.internal/pricing"),
    ).toThrow("Observation URL host must be public");
  });

  it("rejects private IPv6 literals without rejecting public hostnames with fd prefixes", () => {
    expect(() =>
      normalizePublicSourceUrl("https://[fd00::1]/pricing"),
    ).toThrow("Observation URL host must be public");

    expect(normalizePublicSourceUrl("https://fd.example.com/pricing")).toBe(
      "https://fd.example.com/pricing",
    );
  });

  it("rejects IPv4-mapped IPv6 private addresses", () => {
    expect(() =>
      normalizeUrlToOrigin("http://[::ffff:127.0.0.1]/pricing"),
    ).toThrow("Observation URL host must be public");

    expect(() =>
      normalizeUrlToOrigin("http://[::ffff:10.0.0.1]/pricing"),
    ).toThrow("Observation URL host must be public");

    expect(() =>
      normalizePublicSourceUrl("http://[::ffff:192.168.1.1]/pricing"),
    ).toThrow("Observation URL host must be public");
  });

  it("rejects credential-like and user-specific public paths", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/users/123/pricing"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/api/sk-abc123"),
    ).toThrow("Public source URL path is not public-safe");
  });

  it("rejects encoded sensitive path bypasses", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/%75sers/123"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/api/%73k-abc123"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/user%2F42"),
    ).toThrow("Public source URL path is not public-safe");
  });

  it("returns a validation result instead of throwing when requested", () => {
    expect(validatePublicSourceUrl("https://docs.example.com/pricing")).toEqual({
      ok: true,
      value: "https://docs.example.com/pricing",
    });
    expect(validatePublicSourceUrl("https://docs.example.com/user/42")).toEqual({
      ok: false,
      reason: "Public source URL path is not public-safe",
    });
    expect(
      validatePublicSourceUrl("https://docs.example.com/pricing?utm=ad", {
        rejectQueryAndHash: true,
      }),
    ).toEqual({
      ok: false,
      reason: "Public source URL must not include query strings or hashes",
    });
  });
});
