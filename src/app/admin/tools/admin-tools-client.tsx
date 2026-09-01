"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Search,
} from "lucide-react";
import { EntityType, VerificationStatus, getVerificationLabel } from "@/lib/constants";
import { PRICING_CONFIG, PRICING_TYPES, getPricingLabel } from "@/lib/pricing";

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string | null;
  websiteUrl: string;
  pricingType: string;
  isPublished: boolean;
  isFeatured: boolean;
  rating: number;
  tags: string;
  category: { id: string; name: string; slug: string };
  redirectLink?: { id: string; slug: string; clickCount: number } | null;
  entityType: string;
  verificationStatus: string;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  metadata?: string | null;
}

const emptyForm = {
  name: "",
  description: "",
  logo: "",
  websiteUrl: "",
  pricingType: "freemium",
  categoryId: "",
  rating: 0,
  isPublished: true,
  isFeatured: false,
  tags: "",
  entityType: "TOOL",
  verificationStatus: "UNVERIFIED",
  sourceUrl: "",
  metadata: "",
  lastVerifiedAt: "",
};

export function AdminToolsClient({ tools: initialTools }: { tools: Tool[] }) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  const fetchTools = async () => {
    try {
      const res = await fetch("/api/admin/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch (error) {
      console.error("Failed to fetch tools:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTool
        ? `/api/admin/tools/${editingTool.id}`
        : "/api/admin/tools";
      const method = editingTool ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingTool(null);
        setForm(emptyForm);
        fetchTools();
      }
    } catch (error) {
      console.error("Failed to save tool:", error);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim() || scraping) return;
    setScraping(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeError(data.error || "Failed to scrape the URL");
        return;
      }
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        logo: data.logo || prev.logo,
      }));
    } catch (error) {
      console.error("Failed to scrape:", error);
      setScrapeError("Failed to scrape the URL");
    } finally {
      setScraping(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    try {
      const res = await fetch(`/api/admin/tools/${id}`, { method: "DELETE" });
      if (res.ok) fetchTools();
    } catch (error) {
      console.error("Failed to delete tool:", error);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name,
      description: tool.description,
      logo: tool.logo || "",
      websiteUrl: tool.websiteUrl,
      pricingType: tool.pricingType,
      categoryId: tool.category.id,
      rating: tool.rating,
      isPublished: tool.isPublished,
      isFeatured: tool.isFeatured,
      tags: tool.tags || "",
      entityType: tool.entityType || "TOOL",
      verificationStatus: tool.verificationStatus || "UNVERIFIED",
      sourceUrl: tool.sourceUrl || "",
      metadata: tool.metadata || "",
      lastVerifiedAt: tool.lastVerifiedAt
        ? new Date(tool.lastVerifiedAt).toISOString().split("T")[0]
        : "",
    });
    setScrapeUrl("");
    setScrapeError("");
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTool(null);
    setForm(emptyForm);
    setScrapeUrl("");
    setScrapeError("");
    setShowForm(true);
  };

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Tools
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            Manage AI tools in the directory
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Add Tool
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-md text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 transition-all duration-150"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-[16px] font-semibold text-slate-900">
                {editingTool ? "Edit Tool" : "Add New Tool"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTool(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors duration-150"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Quick Import */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                  Quick Import (Optional)
                </h3>
                <p className="text-[12px] text-slate-500 mb-3">
                  Paste a URL to auto-fill the name, description, and logo.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => {
                      setScrapeUrl(e.target.value);
                      setScrapeError("");
                    }}
                    placeholder="https://example.com"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping}
                    className="h-9 px-3 shrink-0 bg-slate-900 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {scraping ? "Scraping..." : "Auto-Fill Data"}
                  </button>
                </div>
                {scrapeError && (
                  <p className="text-[12px] text-red-600 mt-2">{scrapeError}</p>
                )}
              </div>

              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </Field>

              <Field label="Description" required>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input-field min-h-[80px] resize-y"
                  rows={3}
                  required
                />
              </Field>

              <Field label="Website URL" required>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) =>
                    setForm({ ...form, websiteUrl: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </Field>

              <Field label="Logo URL">
                <input
                  type="url"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pricing">
                  <select
                    value={form.pricingType}
                    onChange={(e) =>
                      setForm({ ...form, pricingType: e.target.value })
                    }
                    className="input-field"
                  >
                    {PRICING_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {PRICING_CONFIG[value].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Rating">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: parseFloat(e.target.value) })
                    }
                    className="input-field"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <Field label="Entity Type">
                  <select
                    value={form.entityType}
                    onChange={(e) =>
                      setForm({ ...form, entityType: e.target.value })
                    }
                    className="input-field"
                  >
                    {(Object.keys(EntityType) as (keyof typeof EntityType)[]).map((key) => (
                      <option key={EntityType[key]} value={EntityType[key]}>
                        {EntityType[key].charAt(0) + EntityType[key].slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Verification Status">
                  <select
                    value={form.verificationStatus}
                    onChange={(e) =>
                      setForm({ ...form, verificationStatus: e.target.value })
                    }
                    className="input-field"
                  >
                    {(Object.keys(VerificationStatus) as (keyof typeof VerificationStatus)[]).map((key) => (
                      <option key={VerificationStatus[key]} value={VerificationStatus[key]}>
                        {getVerificationLabel(VerificationStatus[key])}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Last Verified At">
                  <input
                    type="date"
                    value={form.lastVerifiedAt}
                    onChange={(e) =>
                      setForm({ ...form, lastVerifiedAt: e.target.value })
                    }
                    className="input-field"
                  />
                </Field>
                <Field label="Source URL (Verification)">
                  <input
                    type="url"
                    value={form.sourceUrl}
                    onChange={(e) =>
                      setForm({ ...form, sourceUrl: e.target.value })
                    }
                    className="input-field"
                    placeholder="https://authoritative-source.com"
                  />
                </Field>
              </div>

              <Field label="Metadata (JSON Object)">
                <textarea
                  value={form.metadata}
                  onChange={(e) =>
                    setForm({ ...form, metadata: e.target.value })
                  }
                  className="input-field min-h-[80px] font-mono text-[12px]"
                  placeholder='{"contextWindow": "128k", "modalities": ["text", "image"]}'
                  rows={4}
                />
              </Field>

              <Field label="Tags (comma-separated)">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-field"
                  placeholder="ai, writing, content"
                />
              </Field>

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm({ ...form, isPublished: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/5"
                  />
                  <span className="text-[13px] text-slate-700">Published</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/5"
                  />
                  <span className="text-[13px] text-slate-700">Featured</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 h-10 bg-slate-900 text-white text-[14px] font-medium rounded-md hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150"
                >
                  {editingTool ? "Save Changes" : "Create Tool"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTool(null);
                  }}
                  className="h-10 px-5 border border-slate-200 text-slate-700 text-[14px] font-medium rounded-md hover:bg-slate-50 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Pricing
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Entity & Verification
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Clicks
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTools.map((tool) => (
                <tr
                  key={tool.id}
                  className="hover:bg-slate-50 transition-colors duration-100"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-[13px] shrink-0">
                        {tool.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">
                          {tool.name}
                        </p>
                        <p className="text-[12px] text-slate-400 truncate">
                          /go/{tool.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-[13px] text-slate-600">
                      {tool.category.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-[13px] text-slate-600 capitalize">
                      {getPricingLabel(tool.pricingType)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        {tool.entityType}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          tool.verificationStatus === "VERIFIED"
                            ? "text-emerald-600"
                            : tool.verificationStatus === "NEEDS_REVIEW"
                            ? "text-amber-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getVerificationLabel(tool.verificationStatus)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex text-[12px] font-medium px-2 py-0.5 rounded ${
                        tool.isPublished
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tool.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-[13px] font-medium text-slate-700">
                      {tool.redirectLink?.clickCount?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(tool)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150"
                        aria-label={`Edit ${tool.name}`}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <a
                        href={`/go/${tool.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors duration-150"
                        aria-label={`Visit ${tool.name}`}
                      >
                        <ExternalLink
                          className="w-4 h-4"
                          strokeWidth={1.5}
                        />
                      </a>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
                        aria-label={`Delete ${tool.name}`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTools.length === 0 && (
          <div className="text-center py-12 text-[14px] text-slate-400">
            {search
              ? "No tools match your search."
              : "No tools found. Add your first tool to get started."}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
