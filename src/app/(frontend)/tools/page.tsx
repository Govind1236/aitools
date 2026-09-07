import { db } from "@/lib/db";
import { ToolCard } from "@/components/tools/tool-card";
import { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ArrowRight, Sparkles } from "lucide-react";
import { buildToolWhere } from "@/lib/tool-query";
import { EntityType, ATTRIBUTES } from "@/lib/constants";
import { getPricingFilterOptions } from "@/lib/pricing";
import { getPublishedToolCount, getToolsDirectory } from "@/lib/queries/tools";
import { getAllCategories } from "@/lib/queries/categories";

export const metadata: Metadata = {
  title: "All AI Tools Directory (2025/2026)",
  description:
    "Browse our complete curated directory of AI tools, models, agents, and APIs. Filter by category, entity type, pricing, and features.",
};

interface ToolsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    pricing?: string;
    entityType?: string;
    attributes?: string | string[];
  }>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  let query = params.q || "";
  if (query.length > 100) query = query.substring(0, 100);

  const categorySlug = params.category || "";
  const pricing = params.pricing || "";
  const entityType = params.entityType || "";
  const attributeParam = params.attributes;
  const attributes = Array.isArray(attributeParam)
    ? attributeParam
    : attributeParam
    ? [attributeParam]
    : [];

  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");

  const where = await buildToolWhere({
    q: query,
    categorySlug,
    pricing,
    entityType,
    attributes,
  });

  const [tools, allCategories, totalCount] = await Promise.all([
    getToolsDirectory(where),
    getAllCategories(),
    getPublishedToolCount(),
  ]);

  const categories = allCategories.filter((c) => (c._count?.tools ?? 0) > 0);

  // Non-blocking search analytics (anonymous, no IPs).
  if (normalizedQuery && normalizedQuery.length >= 2) {
    db.searchQuery
      .create({
        data: {
          query: query.trim(),
          normalized: normalizedQuery,
          resultCount: tools.length,
        },
      })
      .catch(console.error);
  }

  const activeFilterCount = [
    categorySlug,
    pricing,
    entityType,
    ...attributes,
  ].filter(Boolean).length;
  const activeCategory = allCategories.find((c) => c.slug === categorySlug);

  const makeHref = (patch: Record<string, string | string[]>) => {
    const p = new URLSearchParams();
    const next: Record<string, string | string[]> = {
      ...params,
      ...patch,
    };
    for (const [k, v] of Object.entries(next)) {
      if (Array.isArray(v)) v.forEach((x) => x && p.append(k, x));
      else if (v && v !== "") p.set(k, v);
    }
    return `/tools${p.toString() ? `?${p.toString()}` : ""}`;
  };

  const toggleAttr = (id: string) => {
    const next = attributes.includes(id)
      ? attributes.filter((a) => a !== id)
      : [...attributes, id];
    return makeHref({ attributes: next });
  };

  const clearHref =
    !categorySlug && !pricing && !entityType && attributes.length === 0
      ? ""
      : makeHref({ category: "", pricing: "", entityType: "", attributes: [] });

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-8 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full text-[12px] font-medium text-muted-foreground mb-3 dark:bg-muted dark:border-border dark:text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Curated Directory ({totalCount} tools)</span>
          </div>
          <h1 className="text-[30px] md:text-[38px] font-bold text-foreground tracking-tight leading-tight">
            {query
              ? `Search results for "${query}"`
              : activeCategory
              ? `${activeCategory.name} Tools`
              : "All AI Tools"}
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1 dark:text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {tools.length}
            </span>{" "}
            {tools.length === 1 ? "tool" : "tools"}
            {query && ` matching "${query}"`}
            {activeCategory && ` in ${activeCategory.name}`}
            {pricing && ` with ${pricing} pricing`}
            {entityType && ` · ${entityType.toLowerCase()}s`}
            {attributes.length > 0 &&
              ` · ${attributes
                .map((a) => ATTRIBUTES.find((x) => x.id === a)?.label)
                .filter(Boolean)
                .join(", ")}`}
          </p>
        </div>

        {/* Quick Search Form */}
        <form method="GET" action="/tools" className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search all tools..."
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-full text-[13.5px] text-foreground placeholder-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:border-border-hover transition-all"
          />
          {categorySlug && (
            <input type="hidden" name="category" value={categorySlug} />
          )}
          {pricing && <input type="hidden" name="pricing" value={pricing} />}
          {entityType && (
            <input type="hidden" name="entityType" value={entityType} />
          )}
          {attributes.map((a) => (
            <input key={a} type="hidden" name="attributes" value={a} />
          ))}
        </form>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href={makeHref({ category: "" })}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-150 border shrink-0 ${
              !categorySlug
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-slate-600 hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 dark:text-slate-300 dark:hover:bg-muted dark:border-border dark:hover:border-border-hover"
            }`}
          >
            All Categories ({totalCount})
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={makeHref({ category: cat.slug })}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-150 border shrink-0 ${
                categorySlug === cat.slug
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200/80 hover:border-slate-300"
              }`}
            >
              {cat.name}
              {cat._count && (
                <span className="ml-1.5 opacity-60 text-[11px]">
                  ({cat._count.tools})
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Pricing, Entity Type, Attributes & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-slate-400 mr-1 flex items-center gap-1 dark:text-muted-foreground">
              <SlidersHorizontal className="w-3 h-3" />
              Pricing:
            </span>
            {[
              { value: "", label: "Any" },
              ...getPricingFilterOptions().map((p) => ({
                value: p.value,
                label: p.label,
              })),
            ].map((p) => {
              const isSelected = pricing === p.value;
              return (
                <Link
                  key={p.value || "all"}
                  href={makeHref({ pricing: p.value })}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 dark:bg-muted dark:text-slate-300 dark:hover:bg-accent dark:border-border"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}

            <span className="w-px h-5 bg-slate-200 mx-1 dark:bg-border" />

            {/* Entity type filter */}
            {(Object.keys(EntityType) as (keyof typeof EntityType)[]).map(
              (key) => {
                const val = EntityType[key];
                const isSelected = entityType === val;
                return (
                  <Link
                    key={key}
                    href={
                      isSelected
                        ? makeHref({ entityType: "" })
                        : makeHref({ entityType: val })
                    }
                    className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 dark:bg-muted dark:text-slate-300 dark:hover:bg-accent dark:border-border"
                    }`}
                  >
                    {val.charAt(0) + val.slice(1).toLowerCase()}s
                  </Link>
                );
              }
            )}

            <span className="w-px h-5 bg-slate-200 mx-1 dark:bg-border" />

            {/* Attribute filters */}
            {ATTRIBUTES.map((attr) => {
              const isSelected = attributes.includes(attr.id);
              return (
                <Link
                  key={attr.id}
                  href={toggleAttr(attr.id)}
                  title={attr.description}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 dark:bg-muted dark:text-slate-300 dark:hover:bg-accent dark:border-border"
                  }`}
                >
                  {attr.label}
                </Link>
              );
            })}
          </div>

          {(activeFilterCount > 0 || query) && clearHref && (
            <Link
              href={clearHref}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg transition-colors dark:text-rose-400 dark:hover:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </Link>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      {tools.length === 0 ? (
        <div className="text-center py-24 bg-background rounded-2xl border border-border p-6">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-[17px] font-semibold text-foreground mb-1.5">
            No tools matched your criteria
          </h2>
          <p className="text-[13.5px] text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            Try adjusting your keyword, resetting category filters, or browsing
            our full directory.
          </p>
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-xl hover:bg-primary-hover hover:shadow-md transition-all shadow-sm"
          >
            Reset Filters
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
