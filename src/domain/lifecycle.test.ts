import { describe, expect, it } from "vitest";

import { DomainPolicyError, domainPolicyErrorCode } from "./errors";
import {
  assertCanTransition,
  canTransition,
  getAllowedNextLifecycles,
} from "./lifecycle";
import { publishableLifecycle } from "./vocabularies";

describe("publishable lifecycle policy", () => {
  it("allows only the transition graph defined by the publishing spec", () => {
    const expectedTransitionGraph = [
      [
        publishableLifecycle.draft,
        [publishableLifecycle.pendingReview, publishableLifecycle.archived],
      ],
      [
        publishableLifecycle.pendingReview,
        [
          publishableLifecycle.approved,
          publishableLifecycle.draft,
          publishableLifecycle.rejected,
        ],
      ],
      [
        publishableLifecycle.approved,
        [publishableLifecycle.draft, publishableLifecycle.published],
      ],
      [
        publishableLifecycle.published,
        [
          publishableLifecycle.disputed,
          publishableLifecycle.withdrawn,
          publishableLifecycle.archived,
        ],
      ],
      [
        publishableLifecycle.disputed,
        [
          publishableLifecycle.published,
          publishableLifecycle.withdrawn,
          publishableLifecycle.archived,
        ],
      ],
      [
        publishableLifecycle.withdrawn,
        [publishableLifecycle.pendingReview, publishableLifecycle.archived],
      ],
      [publishableLifecycle.rejected, [publishableLifecycle.draft]],
      [publishableLifecycle.archived, [publishableLifecycle.draft]],
    ] as const;

    for (const [from, allowedNextLifecycles] of expectedTransitionGraph) {
      expect(getAllowedNextLifecycles(from)).toEqual(allowedNextLifecycles);

      for (const to of allowedNextLifecycles) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it("rejects illegal lifecycle shortcuts", () => {
    expect(
      canTransition(publishableLifecycle.draft, publishableLifecycle.published),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.rejected,
        publishableLifecycle.published,
      ),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.withdrawn,
        publishableLifecycle.published,
      ),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.archived,
        publishableLifecycle.published,
      ),
    ).toBe(false);
  });

  it("throws a domain policy error for illegal transitions", () => {
    expect(() =>
      assertCanTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      ),
    ).toThrow(DomainPolicyError);
    expect(() =>
      assertCanTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      ),
    ).toThrow(
      `Illegal lifecycle transition: ${publishableLifecycle.draft} -> ${publishableLifecycle.published}`,
    );
  });

  it("throws illegal transition error codes for illegal transitions", () => {
    try {
      assertCanTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(DomainPolicyError);
      expect((error as DomainPolicyError).code).toBe(
        domainPolicyErrorCode.illegalTransition,
      );
      return;
    }

    throw new Error("Expected assertCanTransition to throw");
  });

  it("returns allowed next states without sharing mutable arrays", () => {
    const first = getAllowedNextLifecycles(publishableLifecycle.published);
    const second = getAllowedNextLifecycles(publishableLifecycle.published);

    expect(first).toEqual([
      publishableLifecycle.disputed,
      publishableLifecycle.withdrawn,
      publishableLifecycle.archived,
    ]);
    expect(first).not.toBe(second);
  });
});
