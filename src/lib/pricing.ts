// ------------------------------------------------------------------
// SHARED PRICING PRESENTATION
// ------------------------------------------------------------------
// Single source of truth for how pricingType values are labelled and
// styled across the app (tool cards, detail page, filters, admin).
// The underlying enum values are preserved: free | freemium | paid | contact.
// ------------------------------------------------------------------

export interface PricingConfig {
  value: string;
  label: string;
  className: string;
}

export const PRICING_TYPES = ["free", "freemium", "paid", "contact"] as const;

export type PricingType = (typeof PRICING_TYPES)[number];

export const PRICING_CONFIG: Record<string, PricingConfig> = {
  free: {
    value: "free",
    label: "Free",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  freemium: {
    value: "freemium",
    label: "Freemium",
    className:
      "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  },
  paid: {
    value: "paid",
    label: "Paid",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  contact: {
    value: "contact",
    label: "Contact",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export function getPricingConfig(value: string | null | undefined): PricingConfig {
  return PRICING_CONFIG[value || ""] || PRICING_CONFIG.freemium;
}

export function getPricingLabel(value: string | null | undefined): string {
  return getPricingConfig(value).label;
}

/** Options for the pricing filter (e.g. on the tools directory). */
export function getPricingFilterOptions(): PricingConfig[] {
  return PRICING_TYPES.map((t) => PRICING_CONFIG[t]);
}
