import { z } from "zod";
import { isoDateTimeSchema } from "../shared/ids";

export const auditActorDtoSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("admin"),
      id: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("system"),
    })
    .strict(),
]);

export const adminAuditEventDtoSchema = z
  .object({
    id: z.string().min(1),
    actor: auditActorDtoSchema,
    commandId: z.string().min(1),
    objectFamily: z.string().min(1),
    objectId: z.string().min(1),
    action: z.string().min(1),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export type AdminAuditEventDto = z.infer<typeof adminAuditEventDtoSchema>;
