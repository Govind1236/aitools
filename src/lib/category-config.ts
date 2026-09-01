import {
  FileText,
  Code2,
  Image,
  Video,
  AudioWaveform,
  Search,
  Zap,
  Megaphone,
  Palette,
  GraduationCap,
  Workflow,
  Briefcase,
  Terminal,
  Bot,
  Brain,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  icon: LucideIcon;
  color: string;
  bg: string;
  badge: string;
}

// Editorial display order. Every category in the system has an explicit entry
// so nothing ever falls back to a generic icon.
export const CATEGORY_ORDER = [
  "writing",
  "coding",
  "image",
  "video",
  "audio",
  "research",
  "productivity",
  "marketing",
  "design",
  "education",
  "automation",
  "business",
  "developer",
  "agents",
  "models",
] as const;
export const categoryConfig: Record<string, CategoryMeta> = {
  writing: {
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  coding: {
    icon: Code2,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  image: {
    icon: Image,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:text-white",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  video: {
    icon: Video,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  audio: {
    icon: AudioWaveform,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  research: {
    icon: Search,
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
  },
  productivity: {
    icon: Zap,
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  marketing: {
    icon: Megaphone,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  design: {
    icon: Palette,
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-100 group-hover:bg-pink-600 group-hover:text-white",
    badge: "bg-pink-50 text-pink-700 border-pink-200",
  },
  education: {
    icon: GraduationCap,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100 group-hover:bg-orange-600 group-hover:text-white",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
  automation: {
    icon: Workflow,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  business: {
    icon: Briefcase,
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200 group-hover:bg-slate-700 group-hover:text-white",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  developer: {
    icon: Terminal,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  agents: {
    icon: Bot,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  models: {
    icon: Brain,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50 border-fuchsia-100 group-hover:bg-fuchsia-600 group-hover:text-white",
    badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  },
};

export function getCategoryMeta(slug: string): CategoryMeta {
  return categoryConfig[slug] ?? FALLBACK_CATEGORY_META;
}

// ------------------------------------------------------------------
// PRESENTATION / CONTENT SEPARATION
// ------------------------------------------------------------------
// Category CONTENT (name, slug, description, sortOrder, active state)
// lives in the database. categoryConfig / getCategoryMeta above is the
// SINGLE mapping between a category slug and its PRESENTATION metadata
// (icon, color, badge). Presentation stays in code for now; it is not
// managed by the CMS/admin in this task.
// ------------------------------------------------------------------
export const FALLBACK_CATEGORY_META: CategoryMeta = {
  icon: Layers,
  color: "text-slate-600",
  bg: "bg-slate-50 border-slate-100 group-hover:bg-slate-600 group-hover:text-white",
  badge: "bg-slate-50 text-slate-700 border-slate-200",
};
