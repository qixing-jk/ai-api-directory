import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./external-link";

describe("ExternalLink", () => {
  it("preserves security rel values when callers add rel metadata", () => {
    render(
      <ExternalLink href="https://example.com" rel="nofollow">
        Example
      </ExternalLink>,
    );

    expect(screen.getByRole("link", { name: /Example/ }).getAttribute("rel")).toBe(
      "nofollow noopener noreferrer",
    );
  });
});
