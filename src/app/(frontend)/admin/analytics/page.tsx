"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MousePointerClick,
  Users,
  TrendingUp,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalClicks: number;
    humanClicks: number;
    topLinks: Array<{
      name: string;
      slug: string;
      _count: { id: number };
    }>;
    topSources: Array<{ source: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
  };
  clicksOverTime: Array<{ date: string; count: number }>;
}

const CHART_COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#64748b"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
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
        <div className="text-[14px] text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            Detailed click and traffic analytics
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Total Clicks"
          value={data?.overview.totalClicks || 0}
          icon={MousePointerClick}
        />
        <KpiCard
          title="Human Clicks"
          value={data?.overview.humanClicks || 0}
          icon={Users}
          accent
        />
        <KpiCard
          title="Click-Through Rate"
          value={
            data?.overview.totalClicks
              ? (data.overview.humanClicks / data.overview.totalClicks) * 100
              : 0
          }
          icon={TrendingUp}
          suffix="%"
          decimals={1}
        />
      </div>

      {/* Clicks over time chart */}
      {data?.clicksOverTime && data.clicksOverTime.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
            Clicks Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.clicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0f172a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top links bar chart */}
        {data?.overview.topLinks && data.overview.topLinks.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
              Top Links
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.overview.topLinks.map((l) => ({
                    name: l.name.length > 10 ? l.name.slice(0, 10) + "..." : l.name,
                    clicks: l._count.id,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                    }}
                  />
                  <Bar dataKey="clicks" fill="#0f172a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Traffic sources pie chart */}
        {data?.overview.topSources && data.overview.topSources.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
              Traffic Sources
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.overview.topSources.map((s) => ({
                      name: s.source,
                      value: s.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.overview.topSources.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2">
              {data.overview.topSources.map((source, index) => (
                <div key={source.source} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-[12px] text-slate-600">{source.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device breakdown */}
        {data?.overview.deviceBreakdown &&
          data.overview.deviceBreakdown.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
                Devices
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.overview.deviceBreakdown.map((d) => ({
                        name: d.device,
                        value: d.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.overview.deviceBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {data.overview.deviceBreakdown.map((device, index) => (
                  <div key={device.device} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-[12px] text-slate-600 capitalize">
                      {device.device}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Countries */}
        {data?.overview.topCountries && data.overview.topCountries.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
              Top Countries
            </h2>
            <div className="space-y-3">
              {data.overview.topCountries.map((country, index) => {
                const maxCount = Math.max(
                  ...data.overview.topCountries.map((c) => c.count)
                );
                const pct = maxCount > 0 ? (country.count / maxCount) * 100 : 0;
                return (
                  <div key={country.country}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-slate-700">
                        {country.country}
                      </span>
                      <span className="text-[12px] text-slate-500">
                        {country.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  suffix = "",
  decimals = 0,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
  suffix?: string;
  decimals?: number;
}) {
  const displayValue =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-500">{title}</p>
          <p
            className={`text-[24px] font-bold mt-1 tracking-tight ${
              accent ? "text-emerald-600" : "text-slate-900"
            }`}
          >
            {displayValue}
            {suffix && (
              <span className="text-[16px] font-semibold ml-0.5">{suffix}</span>
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
