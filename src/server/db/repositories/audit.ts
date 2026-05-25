export type AuditActorInput =
  | { readonly type: "system" }
  | { readonly type: "admin"; readonly id: string };

export type AppendAuditEventInput = {
  readonly actor: AuditActorInput;
  readonly commandId: string;
  readonly objectFamily: string;
  readonly objectId: string;
  readonly action: string;
};

export type AuditWriteSource = {
  readonly appendAuditEvent: (
    input: AppendAuditEventInput,
  ) => Promise<{ readonly id: string }>;
};

export function createAuditEventAppender(source: AuditWriteSource) {
  return {
    appendAuditEvent(input: AppendAuditEventInput) {
      return source.appendAuditEvent(input);
    },
  };
}
