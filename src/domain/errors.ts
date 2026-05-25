export const domainPolicyErrorCode = {
  illegalTransition: "illegal_transition",
  privacyViolation: "privacy_violation",
  publicationNotAllowed: "publication_not_allowed",
  projectionBoundaryViolation: "projection_boundary_violation",
  projectionConflict: "projection_conflict",
  rollbackNotAllowed: "rollback_not_allowed",
} as const;

export const domainPolicyErrorCodes = Object.values(domainPolicyErrorCode);

export type DomainPolicyErrorCode =
  (typeof domainPolicyErrorCode)[keyof typeof domainPolicyErrorCode];

export class DomainPolicyError extends Error {
  readonly code: DomainPolicyErrorCode;

  constructor(code: DomainPolicyErrorCode, message: string) {
    super(message);
    this.name = "DomainPolicyError";
    this.code = code;
  }
}
