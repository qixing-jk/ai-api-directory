import { z } from "zod";
import { factLevels, type FactLevel } from "~/domain/vocabularies";
import {
  assertNoSensitiveObservationFields,
  assertObservationSourceAllowed,
  modelListSources,
  normalizeObservationOrigin,
  normalizeObservationPublicSourceUrl,
  observationKind,
  observationSources,
  probeStatuses,
  type ModelListSource,
  type ObservationGovernanceOptions,
  type ObservationKind,
  type ObservationSource,
  type ProbeStatus,
} from "~/domain/observation/policy";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";

const observationSourceValues = observationSources as [
  ObservationSource,
  ...ObservationSource[],
];
const factLevelValues = factLevels as [FactLevel, ...FactLevel[]];
const modelListSourceValues = modelListSources as [
  ModelListSource,
  ...ModelListSource[],
];
const probeStatusValues = probeStatuses as [ProbeStatus, ...ProbeStatus[]];

const confidenceHintSchema = z.number().int().min(0).max(100);

const observationOriginSchema = z.string().transform((value, ctx) => {
  try {
    return normalizeObservationOrigin(value);
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return z.NEVER;
    }
    throw error;
  }
});

const observationPublicSourceUrlSchema = z.string().transform((value, ctx) => {
  try {
    return normalizeObservationPublicSourceUrl(value);
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return z.NEVER;
    }
    throw error;
  }
});

const baseObservationFields = {
  observedAt: isoDateTimeSchema,
  producerConfidenceHint: confidenceHintSchema.optional(),
} as const;

export const observationProducerSchema = z
  .object({
    productName: z.string().min(1),
    productVersion: z.string().min(1).optional(),
    extensionVersion: z.string().min(1).optional(),
    contractVersion: z.literal("2026-05-26"),
  })
  .strict();

export const observationConsentSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("not_applicable") }).strict(),
  z
    .object({
      state: z.literal("explicit"),
      version: z.string().min(1),
      acceptedAt: isoDateTimeSchema,
    })
    .strict(),
]);

export const siteObservationSchema = z
  .object({
    kind: z.literal(observationKind.site),
    siteKey: slugSchema,
    displayName: z.string().min(1),
    origin: observationOriginSchema,
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    siteType: z.enum([
      "relay",
      "aggregator",
      "gateway",
      "model_provider",
      "unknown",
    ]),
    category: z.enum([
      "ai_gateway",
      "model_access",
      "developer_tooling",
      "unknown",
    ]),
    ...baseObservationFields,
  })
  .strict();

export const endpointObservationSchema = z
  .object({
    kind: z.literal(observationKind.endpoint),
    siteKey: slugSchema,
    endpointKey: slugSchema,
    origin: observationOriginSchema,
    endpointKind: z.enum([
      "homepage",
      "console",
      "api",
      "docs",
      "pricing",
      "recharge",
      "status",
      "unknown",
    ]),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const modelObservationSchema = z
  .object({
    kind: z.literal(observationKind.model),
    canonicalModelKey: slugSchema,
    displayName: z.string().min(1),
    family: z.string().min(1),
    creator: z.string().min(1),
    routeModelId: z.string().min(1).optional(),
    aliases: z.array(z.string().min(1)),
    contextWindow: z.number().int().positive().optional(),
    capabilities: z.array(z.string().min(1)),
    source: z.string().min(1),
    ...baseObservationFields,
  })
  .strict();

export const modelRouteObservationSchema = z
  .object({
    kind: z.literal(observationKind.modelRoute),
    siteKey: slugSchema,
    endpointKey: slugSchema,
    canonicalModelKey: slugSchema,
    routeModelId: z.string().min(1),
    providerType: z.enum([
      "openai_compatible",
      "anthropic_compatible",
      "native",
      "unknown",
    ]),
    upstreamClaim: z.string().min(1).optional(),
    factLevel: z.enum(factLevelValues),
    modelListSource: z.enum(modelListSourceValues),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const priceObservationSchema = z
  .object({
    kind: z.literal(observationKind.price),
    siteKey: slugSchema,
    routeModelId: z.string().min(1),
    currency: z.string().length(3),
    billingUnit: z.enum([
      "per_1m_tokens",
      "ratio_multiplier",
      "per_request",
      "minimum_recharge",
      "unknown",
    ]),
    inputPer1M: z.number().nonnegative().optional(),
    outputPer1M: z.number().nonnegative().optional(),
    cacheReadPer1M: z.number().nonnegative().optional(),
    cacheWritePer1M: z.number().nonnegative().optional(),
    requestFee: z.number().nonnegative().optional(),
    minimumRecharge: z.number().nonnegative().optional(),
    discountNote: z.string().min(1).optional(),
    exchangeRateNote: z.string().min(1).optional(),
    source: z.string().min(1),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    effectiveAt: isoDateTimeSchema.optional(),
    expiresAt: isoDateTimeSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const verificationProbeObservationSchema = z
  .object({
    kind: z.literal(observationKind.verificationProbe),
    target: z
      .object({
        siteKey: slugSchema,
        routeModelId: z.string().min(1).optional(),
      })
      .strict(),
    apiType: z.enum([
      "openai_chat_completions",
      "openai_responses",
      "anthropic_messages",
      "model_list",
      "unknown",
    ]),
    probeId: z.string().min(1),
    status: z.enum(probeStatusValues),
    modelId: z.string().min(1).optional(),
    durationBucket: z.enum(["lt_1s", "1s_to_5s", "gt_5s", "unknown"]),
    errorCategory: z.enum([
      "none",
      "auth_failed",
      "rate_limited",
      "network_error",
      "unsupported",
      "unknown",
    ]),
    ...baseObservationFields,
  })
  .strict();

export const cliSupportObservationSchema = z
  .object({
    kind: z.literal(observationKind.cliSupport),
    target: z
      .object({
        siteKey: slugSchema,
        routeModelId: z.string().min(1).optional(),
      })
      .strict(),
    tool: z.enum([
      "claude_code",
      "codex_cli",
      "gemini_cli",
      "cursor",
      "unknown",
    ]),
    probeId: z.string().min(1),
    status: z.enum(probeStatusValues),
    modelId: z.string().min(1).optional(),
    durationBucket: z.enum(["lt_1s", "1s_to_5s", "gt_5s", "unknown"]),
    errorCategory: z.enum([
      "none",
      "auth_failed",
      "rate_limited",
      "network_error",
      "unsupported",
      "unknown",
    ]),
    ...baseObservationFields,
  })
  .strict();

export const capabilityObservationSchema = z
  .object({
    kind: z.literal(observationKind.capability),
    siteKey: slugSchema,
    capability: z.enum([
      "model_list",
      "balance_refresh",
      "usage_refresh",
      "check_in",
      "key_management",
      "api_credential_verification",
      "cli_compatibility",
      "all_api_hub_add_flow",
      "all_api_hub_manage_flow",
    ]),
    status: z.enum(["supported", "unsupported", "unknown"]),
    ...baseObservationFields,
  })
  .strict();

export const riskCandidateObservationSchema = z
  .object({
    kind: z.literal(observationKind.riskCandidate),
    siteKey: slugSchema,
    riskType: z.enum([
      "price_missing",
      "stale_observation",
      "inconsistent_model_claim",
      "repeated_probe_failure",
      "privacy_unknown",
      "unknown",
    ]),
    severityHint: z.enum(["info", "warning", "critical"]),
    source: z.string().min(1),
    ...baseObservationFields,
  })
  .strict();

export const observationSchema = z.discriminatedUnion("kind", [
  siteObservationSchema,
  endpointObservationSchema,
  modelObservationSchema,
  modelRouteObservationSchema,
  priceObservationSchema,
  verificationProbeObservationSchema,
  cliSupportObservationSchema,
  capabilityObservationSchema,
  riskCandidateObservationSchema,
]);

function isEditorialPriceNoteSource(source: ObservationSource): boolean {
  return source === "curated_seed" || source === "admin_import";
}

const observationBatchObjectSchema = z
  .object({
    schemaVersion: z.literal("2026-05-26"),
    source: z.enum(observationSourceValues),
    batchId: z.string().uuid(),
    generatedAt: isoDateTimeSchema,
    producer: observationProducerSchema,
    consent: observationConsentSchema,
    observations: z.array(observationSchema).min(1),
  })
  .strict();

function validateObservationBatchPolicy(
  batch: z.infer<typeof observationBatchObjectSchema>,
  ctx: z.RefinementCtx,
  options: ObservationGovernanceOptions,
) {
  try {
    assertObservationSourceAllowed({
      source: batch.source,
      consent: batch.consent,
      options,
    });
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return;
    }
    throw error;
  }

  for (const [index, observation] of batch.observations.entries()) {
    if (
      observation.kind === observationKind.price &&
      !isEditorialPriceNoteSource(batch.source) &&
      (observation.discountNote || observation.exchangeRateNote)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["observations", index],
        message:
          "Discount and exchange-rate notes require curated seed or admin import review",
      });
    }
  }
}

function validateNoSensitiveObservationFields(
  input: unknown,
  ctx: z.RefinementCtx,
) {
  try {
    assertNoSensitiveObservationFields(input);
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return;
    }
    throw error;
  }
}

export function createObservationBatchSchema(
  options: ObservationGovernanceOptions = {},
) {
  return z
    .unknown()
    .superRefine(validateNoSensitiveObservationFields)
    .pipe(
      observationBatchObjectSchema.superRefine((batch, ctx) => {
        validateObservationBatchPolicy(batch, ctx, options);
      }),
    );
}

export const observationBatchSchema = createObservationBatchSchema();

export type ObservationKindValue = ObservationKind;
export type ObservationInput = z.infer<typeof observationSchema>;
export type SiteObservationInput = z.infer<typeof siteObservationSchema>;
export type EndpointObservationInput = z.infer<typeof endpointObservationSchema>;
export type ModelObservationInput = z.infer<typeof modelObservationSchema>;
export type ModelRouteObservationInput = z.infer<
  typeof modelRouteObservationSchema
>;
export type PriceObservationInput = z.infer<typeof priceObservationSchema>;
export type VerificationProbeObservationInput = z.infer<
  typeof verificationProbeObservationSchema
>;
export type CliSupportObservationInput = z.infer<
  typeof cliSupportObservationSchema
>;
export type CapabilityObservationInput = z.infer<
  typeof capabilityObservationSchema
>;
export type RiskCandidateObservationInput = z.infer<
  typeof riskCandidateObservationSchema
>;
export type ObservationBatchInput = z.infer<typeof observationBatchSchema>;
