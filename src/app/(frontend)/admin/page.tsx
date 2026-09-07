"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  MousePointerClick,
  Users,
  Link2,
  TrendingUp,
} from "lucide-react";

interface DashboardData {
  overview: {
    totalClicks: number;
    humanClicks: number;
    topLinks: Array<{ name: string; slug: string; _count: { id: number } }>;
    topSources: Array<{ source: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
  };
  clicksOverTime: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const fetchAnalytics = async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[14px] text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            Overview of your analytics
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-md text-[13px] text-slate-700 bg-white focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 transition-all duration-150 cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Clicks"
          value={data?.overview.totalClicks || 0}
          icon={MousePointerClick}
        />
        <KpiCard
          title="Human Clicks"
          value={data?.overview.humanClicks || 0}
          icon={Users}
        />
        <KpiCard
          title="Active Links"
          value={data?.overview.topLinks?.length || 0}
          icon={Link2}
        />
        <KpiCard
          title="Traffic Sources"
          value={data?.overview.topSources?.length || 0}
          icon={TrendingUp}
        />
      </div>

      {/* Data panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataPanel
          title="Top Links"
          items={
            data?.overview.topLinks?.map((l) => ({
              label: l.name,
              sublabel: `/go/${l.slug}`,
              value: l._count.id,
            })) || []
          }
          emptyMessage="No click data yet"
        />
        <DataPanel
          title="Traffic Sources"
          items={
            data?.overview.topSources?.map((s) => ({
              label: s.source,
              value: s.count,
            })) || []
          }
          emptyMessage="No source data yet"
        />
        <DataPanel
          title="Top Countries"
          items={
            data?.overview.topCountries?.map((c) => ({
              label: c.country,
              value: c.count,
            })) || []
          }
          emptyMessage="No country data yet"
        />
        <DevicePanel
          items={data?.overview.deviceBreakdown || []}
        />
      </div>

      {/* Clicks over time bar chart */}
      {data?.clicksOverTime && data.clicksOverTime.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 mt-4">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
            Clicks Over Time
          </h2>
          <div className="h-48 flex items-end gap-px">
            {data.clicksOverTime.map((point) => {
              const maxCount = Math.max(
                ...data.clicksOverTime.map((p) => p.count),
                1
              );
              const height = (point.count / maxCount) * 100;
              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="relative w-full">
                    <div
                      className="w-full bg-slate-200 rounded-t hover:bg-slate-900 transition-colors duration-150 cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${point.date}: ${point.count} clicks`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-slate-400">
            <span>{data.clicksOverTime[0]?.date}</span>
            <span>
              {data.clicksOverTime[Math.floor(data.clicksOverTime.length / 2)]?.date}
            </span>
            <span>
              {data.clicksOverTime[data.clicksOverTime.length - 1]?.date}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-500">{title}</p>
          <p className="text-[24px] font-bold text-slate-900 mt-1 tracking-tight">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function DataPanel({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{ label: string; sublabel?: string; value: number }>;
  emptyMessage: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
        {title}
      </h2>
      <div className="space-y-2.5">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-1.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-700 truncate">
                  {item.label}
                </p>
                {item.sublabel && (
                  <p className="text-[12px] text-slate-400 truncate">
                    {item.sublabel}
                  </p>
                )}
              </div>
              <span className="text-[13px] font-semibold text-slate-900 ml-3 shrink-0">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-slate-400 py-4 text-center">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function DevicePanel({
  items,
}: {
  items: Array<{ device: string; count: number }>;
}) {
  const total = items.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
        Devices
      </h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((device) => {
            const pct = total > 0 ? Math.round((device.count / total) * 100) : 0;
            return (
              <div key={device.device}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-slate-700 capitalize">
                    {device.device}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {device.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-slate-400 py-4 text-center">
            No device data yet
          </p>
        )}
      </div>
    </div>
  );
}
