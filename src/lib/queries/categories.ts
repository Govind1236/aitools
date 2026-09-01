import { db } from "@/lib/db";

// ------------------------------------------------------------------
// REUSABLE CATEGORY QUERIES (server-side)
// ------------------------------------------------------------------
// Categories themselves (name, slug, description, sortOrder) live in the
// database. These helpers surface only categories that contain at least
// one published (active) tool, so public listings never show empty
// categories. Presentation styling (icons/colors) stays separate in
// src/lib/category-config.ts.
// ------------------------------------------------------------------

/** All categories ordered for display, with published tool counts. */
export async function getAllCategories() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { tools: { where: { isPublished: true } } },
      },
    },
  });
}

/** Categories that contain at least one published tool. */
export async function getActiveCategories() {
  const categories = await getAllCategories();
  return categories.filter((c) => (c._count?.tools ?? 0) > 0);
}
