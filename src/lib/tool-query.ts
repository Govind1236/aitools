import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { buildAttributeWhere } from "@/lib/attributes";

export interface ToolFilterInput {
  q?: string;
  categorySlug?: string;
  pricing?: string;
  entityType?: string;
  attributes?: string[]; // attribute ids, combined with AND
}

/**
 * Build a Prisma `where` clause for the public tool directory.
 * Supports combined dimensions: text search, category, pricing,
 * entity type, and attributes (e.g. Free + Image, Open Source + Models).
 */
export async function buildToolWhere(
  input: ToolFilterInput
): Promise<Prisma.ToolWhereInput> {
  const where: Prisma.ToolWhereInput = { isPublished: true };

  if (input.categorySlug) {
    const cat = await db.category.findUnique({
      where: { slug: input.categorySlug },
    });
    if (cat) where.categoryId = cat.id;
  }

  if (input.pricing) {
    where.pricingType = input.pricing;
  }

  if (input.entityType) {
    where.entityType = input.entityType.toUpperCase();
  }

  // Flattened AND conditions contributed by search and attributes.
  const andConds: Prisma.ToolWhereInput[] = [];

  const query = (input.q || "").trim().toLowerCase();
  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    const orConds: Prisma.ToolWhereInput[] = terms.flatMap((term) => [
      { name: { contains: term } },
      { description: { contains: term } },
      { tags: { contains: term } },
      { entityType: { contains: term } },
      { category: { name: { contains: term } } },
    ]);
    andConds.push({ OR: orConds });
  }

  if (input.attributes && input.attributes.length > 0) {
    andConds.push(...buildAttributeWhere(input.attributes));
  }

  if (andConds.length > 0) {
    where.AND = andConds;
  }

  return where;
}
