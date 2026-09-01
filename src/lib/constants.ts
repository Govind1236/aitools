export const EntityType = {
  TOOL: "TOOL",
  MODEL: "MODEL",
  AGENT: "AGENT",
  API: "API",
  INFRASTRUCTURE: "INFRASTRUCTURE",
  RESOURCE: "RESOURCE",
} as const;

export type EntityTypeType = typeof EntityType[keyof typeof EntityType];

export const VerificationStatus = {
  VERIFIED: "VERIFIED",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  UNVERIFIED: "UNVERIFIED",
  INACTIVE: "INACTIVE",
} as const;

export type VerificationStatusType = typeof VerificationStatus[keyof typeof VerificationStatus];

// Standard verification threshold (e.g., 90 days)
export const VERIFICATION_STALE_DAYS = 90;

// ------------------------------------------------------------------
// Verification presentation (human-readable labels)
// Single source of truth so the same status renders the same label
// everywhere. Structured values live in `VerificationStatus` above.
// ------------------------------------------------------------------
export const VERIFICATION_LABELS: Record<string, string> = {
  [VerificationStatus.VERIFIED]: "Verified",
  [VerificationStatus.NEEDS_REVIEW]: "Needs Review",
  [VerificationStatus.UNVERIFIED]: "Unverified",
  [VerificationStatus.INACTIVE]: "Inactive",
};

export function getVerificationLabel(status: string | null | undefined): string {
  return VERIFICATION_LABELS[status || ""] || status || "Unverified";
}

// ------------------------------------------------------------------
// ATTRIBUTES (dimension orthogonal to Category and EntityType)
// ------------------------------------------------------------------
// Attribute/filter definitions and their Prisma conditions now live in
// `src/lib/attributes.ts` (single source of truth). They are re-exported
// here for backwards compatibility with existing imports.
// ------------------------------------------------------------------
export {
  ATTRIBUTES,
  getAttribute,
  buildAttributeWhere,
  type ToolAttribute,
} from "./attributes";
