import { z } from "zod";

export const entityIdSchema = z.string().uuid();
export const versionIdSchema = z.string().uuid();
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
