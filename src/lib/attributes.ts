import { Prisma } from "@prisma/client";

// ------------------------------------------------------------------
// SHARED ATTRIBUTE / FILTER DEFINITION
// ------------------------------------------------------------------
// Attributes are an application-level filter dimension orthogonal to
// Category and EntityType. They are derived from existing fields:
// pricingType + tags + entityType.
//
// Each attribute declares:
//   - presentation (label, description)
//   - a match predicate for in-memory checks (`matches`)
//   - the concrete Prisma conditions to apply in queries (`toPrisma`)
//
// This is the single source of truth used by the tools directory,
// category pages, homepage, API routes, search, and admin.
// ------------------------------------------------------------------

export interface ToolAttribute {
  id: string;
  label: string;
  description: string;
  matches: (tool: {
    pricingType: string;
    tags: string;
    entityType?: string;
  }) => boolean;
  /** Prisma conditions (OR'd together) that select matching tools. */
  toPrisma: () => Prisma.ToolWhereInput[];
}

const hasTag = (tags: string, ...needles: string[]) => {
  const list = tags
    .split(",")
    .map((t) => t.trim().toLowerCase());
  return needles.some((n) => list.includes(n.toLowerCase()));
};

export const ATTRIBUTES: ToolAttribute[] = [
  {
    id: "free",
    label: "Free",
    description: "Completely free to use",
    matches: (t) => t.pricingType === "free",
    toPrisma: () => [{ pricingType: "free" }],
  },
  {
    id: "free-tier",
    label: "Free Tier",
    description: "Has a usable free tier",
    matches: (t) =>
      t.pricingType === "freemium" || hasTag(t.tags, "free-tier"),
    toPrisma: () => [
      { pricingType: "freemium" },
      { tags: { contains: "free-tier" } },
    ],
  },
  {
    id: "open-source",
    label: "Open Source",
    description: "Source available or open weights",
    matches: (t) =>
      hasTag(t.tags, "open-source", "open-weights", "open-source-model"),
    toPrisma: () => [
      { tags: { contains: "open-source" } },
      { tags: { contains: "open-weights" } },
    ],
  },
  {
    id: "local",
    label: "Local",
    description: "Can run locally / offline",
    matches: (t) => hasTag(t.tags, "local", "offline", "self-host", "self-hosted"),
    toPrisma: () => [
      { tags: { contains: "local" } },
      { tags: { contains: "offline" } },
      { tags: { contains: "self-host" } },
      { tags: { contains: "self-hosted" } },
    ],
  },
  {
    id: "api",
    label: "API Available",
    description: "Exposes a developer API",
    matches: (t) =>
      t.entityType === "API" || hasTag(t.tags, "api", "api-available", "serverless"),
    toPrisma: () => [
      { entityType: "API" },
      { tags: { contains: "api" } },
      { tags: { contains: "serverless" } },
    ],
  },
  {
    id: "no-signup",
    label: "No Signup",
    description: "Usable without creating an account",
    matches: (t) =>
      hasTag(t.tags, "no-signup", "no-login", "anonymous", "no-sign-in"),
    toPrisma: () => [
      { tags: { contains: "no-signup" } },
      { tags: { contains: "no-login" } },
      { tags: { contains: "no-sign-in" } },
      { tags: { contains: "anonymous" } },
    ],
  },
];

export function getAttribute(id: string): ToolAttribute | undefined {
  return ATTRIBUTES.find((a) => a.id === id);
}

/**
 * Build an `AND` list of Prisma conditions for a set of attribute ids.
 * Each requested attribute contributes its own `OR` group, so multiple
 * attributes are combined with AND semantics (a tool must satisfy them all).
 * Returns an empty array when no attributes are provided.
 */
export function buildAttributeWhere(attributes: string[]): Prisma.ToolWhereInput[] {
  return attributes
    .map((id) => getAttribute(id))
    .filter((a): a is ToolAttribute => Boolean(a))
    .map((a) => ({ OR: a.toPrisma() }));
}
