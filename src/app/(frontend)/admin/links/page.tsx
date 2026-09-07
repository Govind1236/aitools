"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Link {
  id: string;
  slug: string;
  name: string;
  destination: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  tool?: { id: string; name: string };
  campaign?: { id: string; name: string };
  _count: { clicks: number };
}

export default function AdminLinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    slug: "",
    name: "",
    destination: "",
    isActive: true,
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/links");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLink
        ? `/api/admin/links/${editingLink.id}`
        : "/api/admin/links";
      const method = editingLink ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingLink(null);
        setForm({ slug: "", name: "", destination: "", isActive: true });
        fetchLinks();
      }
    } catch (error) {
      console.error("Failed to save link:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
      if (res.ok) fetchLinks();
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  };

  const handleToggleActive = async (link: Link) => {
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (res.ok) fetchLinks();
    } catch (error) {
      console.error("Failed to toggle link:", error);
    }
  };

  const filteredLinks = links.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[14px] text-slate-400">Loading links...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Redirect Links
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            Manage tracked outbound links
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ slug: "", name: "", destination: "", isActive: true });
            setEditingLink(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Add Link
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
          placeholder="Search links..."
          className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-md text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 transition-all duration-150"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-[16px] font-semibold text-slate-900">
                {editingLink ? "Edit Link" : "Add New Link"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingLink(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors duration-150"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="input-field"
                  placeholder="my-tool"
                  required
                />
                <p className="text-[12px] text-slate-400 mt-1">
                  Public URL: /go/{form.slug || "your-slug"}
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({ ...form, destination: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/5"
                />
                <span className="text-[13px] text-slate-700">Active</span>
              </label>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 h-10 bg-slate-900 text-white text-[14px] font-medium rounded-md hover:bg-slate-800 active:bg-slate-950 transition-colors duration-150"
                >
                  {editingLink ? "Save Changes" : "Create Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLink(null);
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
                  Link
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Destination
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50 transition-colors duration-100">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-[13px] font-medium text-slate-900">
                        {link.name}
                      </p>
                      <p className="text-[12px] text-blue-600 font-mono">
                        /go/{link.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-[13px] text-slate-500 truncate max-w-[300px]">
                      {link.destination}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded cursor-pointer transition-colors duration-150 ${
                        link.isActive
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      aria-label={`Toggle ${link.name} ${link.isActive ? "off" : "on"}`}
                    >
                      {link.isActive ? (
                        <ToggleRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                      {link.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[13px] font-semibold text-slate-900">
                      {link.clickCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingLink(link);
                          setForm({
                            slug: link.slug,
                            name: link.name,
                            destination: link.destination,
                            isActive: link.isActive,
                          });
                          setShowForm(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150"
                        aria-label={`Edit ${link.name}`}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <a
                        href={`/go/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors duration-150"
                        aria-label={`Visit ${link.name}`}
                      >
                        <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
                        aria-label={`Delete ${link.name}`}
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
        {filteredLinks.length === 0 && (
          <div className="text-center py-12 text-[14px] text-slate-400">
            {search
              ? "No links match your search."
              : "No links found. Create your first tracked link."}
          </div>
        )}
      </div>
    </div>
  );
}
