import { Prisma } from "@prisma/client";

// ------------------------------------------------------------------
// PRISMA → PAYLOAD WHERE CLAUSE CONVERTER
// ------------------------------------------------------------------
// Converts the Prisma `ToolWhereInput` shapes produced by
// `buildToolWhere()` into Payload CMS `Where` clauses.
//
// Only the operators actually used by the application's catalog
// queries are supported. Unsupported shapes fall back to an empty
// where (returns everything), which is safe for Payload reads.
// ------------------------------------------------------------------

/** Minimal Payload Where shape (matches @payloadcms/exports Where). */
interface PayloadWhere {
  and?: PayloadWhere[];
  or?: PayloadWhere[];
  [field: string]: unknown;
}

type PrismaWhere = Prisma.ToolWhereInput;

/**
 * Recursively convert a Prisma `ToolWhereInput` into a Payload `Where`.
 *
 * Handles:
 * - `isPublished`, `isFeatured`, `pricingType`, `entityType`
 *   → simple `equals` conditions
 * - `categoryId` (Prisma cuid)
 *   → `category.legacyPrismaId` `equals` (Payload relationship filter)
 * - `name.contains`, `description.contains`, `tags.contains`
 *   → Payload `contains`
 * - `id.not`
 *   → Payload `not_equals`
 * - `OR`, `AND`
 *   → Payload `or`, `and`
 * - `category.name.contains`, `provider.name.contains`
 *   → Payload nested `contains` via dot-path
 * - `structuredTags.some.tag.name.contains`
 *   → Payload relationship `contains`
 */
export function prismaWhereToPayload(where: PrismaWhere): PayloadWhere {
  if (!where || typeof where !== "object") return {};

  const result: PayloadWhere = {};

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined || value === null) continue;

    switch (key) {
      // ── Logical combinators ──────────────────────────────
      case "OR": {
        if (Array.isArray(value) && value.length > 0) {
          const orClauses = value
            .map((clause) => prismaWhereToPayload(clause as PrismaWhere))
            .filter((c) => Object.keys(c).length > 0);
          if (orClauses.length === 1) Object.assign(result, orClauses[0]);
          else if (orClauses.length > 1) result.or = orClauses;
        }
        break;
      }
      case "AND": {
        if (Array.isArray(value) && value.length > 0) {
          const andClauses = value
            .map((clause) => prismaWhereToPayload(clause as PrismaWhere))
            .filter((c) => Object.keys(c).length > 0);
          if (andClauses.length === 1) Object.assign(result, andClauses[0]);
          else if (andClauses.length > 1) result.and = andClauses;
        }
        break;
      }

      // ── Simple boolean / string equality ─────────────────
      case "isPublished":
      case "isFeatured":
      case "isSponsored":
        if (typeof value === "boolean") result[key] = { equals: value };
        break;

      case "pricingType":
      case "entityType":
        if (typeof value === "string") result[key] = { equals: value };
        break;

      // Prisma `categoryId` stores the Prisma Category id (cuid). Payload
      // tools reference the Payload Category doc instead, so filter the
      // relationship by the mirrored `legacyPrismaId` field to stay
      // source-agnostic.
      case "categoryId":
        if (typeof value === "string") {
          result["category.legacyPrismaId"] = { equals: value };
        }
        break;

      // ── Simple equality (top-level) ──────────────────────
      default: {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const inner = value as Record<string, unknown>;

          // Simple equality: `{ field: "value" }`
          if ("equals" in inner && typeof inner.equals === "string") {
            result[key] = { equals: inner.equals };
            break;
          }

          // `contains` operator
          if ("contains" in inner && typeof inner.contains === "string") {
            result[key] = { contains: inner.contains };
            break;
          }

          // `not` operator (e.g. `{ id: { not: "xyz" } }`)
          if ("not" in inner && typeof inner.not === "string") {
            result[key] = { not_equals: inner.not };
            break;
          }

          // `in` operator
          if ("in" in inner && Array.isArray(inner.in)) {
            result[key] = { in: inner.in };
            break;
          }

          // ── Nested relationship conditions ────────────────

          // `{ category: { name: { contains: term } } }`
          if (key === "category" && typeof inner.name === "object" && inner.name !== null) {
            const nameCond = inner.name as Record<string, unknown>;
            if ("contains" in nameCond && typeof nameCond.contains === "string") {
              result["category.name"] = { contains: nameCond.contains };
              break;
            }
          }

          // `{ provider: { name: { contains: term } } }`
          if (key === "provider" && typeof inner.name === "object" && inner.name !== null) {
            const nameCond = inner.name as Record<string, unknown>;
            if ("contains" in nameCond && typeof nameCond.contains === "string") {
              result["provider.name"] = { contains: nameCond.contains };
              break;
            }
          }

          // `{ structuredTags: { some: { tag: { name: { contains: term } } } } }`
          if (key === "structuredTags" && "some" in inner) {
            const someVal = inner.some as Record<string, unknown>;
            if (someVal && typeof someVal === "object" && "tag" in someVal) {
              const tagObj = someVal.tag as Record<string, unknown>;
              if (tagObj && typeof tagObj === "object") {
                // tag.name.contains
                if (
                  "name" in tagObj &&
                  typeof tagObj.name === "object" &&
                  tagObj.name !== null
                ) {
                  const nameCond = tagObj.name as Record<string, unknown>;
                  if ("contains" in nameCond && typeof nameCond.contains === "string") {
                    result["structuredTags.name"] = { contains: nameCond.contains };
                    break;
                  }
                }
                // tag.slug.contains
                if (
                  "slug" in tagObj &&
                  typeof tagObj.slug === "object" &&
                  tagObj.slug !== null
                ) {
                  const slugCond = tagObj.slug as Record<string, unknown>;
                  if ("contains" in slugCond && typeof slugCond.contains === "string") {
                    result["structuredTags.slug"] = { contains: slugCond.contains };
                    break;
                  }
                }
              }
            }
          }
        }
        break;
      }
    }
  }

  return result;
}
