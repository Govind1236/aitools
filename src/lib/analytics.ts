import { UAParser } from "ua-parser-js";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from "date-fns";
import { getPayloadClient } from "@/lib/payload/db";

export interface ClickData {
  linkId: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  country?: string;
  userAgent?: string;
  ipAddress?: string;
}

export function parseUserAgent(userAgent: string | undefined) {
  if (!userAgent) {
    return { deviceType: "unknown", browser: "unknown", operatingSystem: "unknown" };
  }

  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  let deviceType = "desktop";
  if (device.type === "mobile") deviceType = "mobile";
  else if (device.type === "tablet") deviceType = "tablet";

  return {
    deviceType,
    browser: browser.name || "unknown",
    operatingSystem: os.name || "unknown",
  };
}

export async function recordClick(data: ClickData) {
  const { deviceType, browser, operatingSystem } = parseUserAgent(data.userAgent);

  // Basic bot detection
  const trafficType = detectTrafficType(data.userAgent, data.ipAddress);

  const payload = await getPayloadClient();

  const click = await payload.create({
    collection: "click-events",
    data: {
      link: data.linkId as any,
      timestamp: new Date().toISOString(),
      referrer: data.referrer || null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      utmContent: data.utmContent || null,
      utmTerm: data.utmTerm || null,
      country: data.country || null,
      deviceType,
      browser,
      operatingSystem,
      trafficType: trafficType as "human" | "suspicious" | "bot",
      isSuspicious: trafficType !== "human",
      ipAddress: data.ipAddress || null,
    },
  });

  // Increment click count on the link
  const { docs } = await payload.find({
    collection: "redirect-links",
    where: { id: { equals: data.linkId } },
    limit: 1,
  });
  const link = docs[0];
  if (link) {
    await payload.update({
      collection: "redirect-links",
      id: String(link.id),
      data: { clickCount: Number(link.clickCount ?? 0) + 1 },
    });
  }

  return click;
}

function detectTrafficType(
  userAgent: string | undefined,
  ipAddress: string | undefined
): string {
  if (!userAgent) return "bot";

  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
    /python-requests/i, /go-http-client/i, /java\//i, /headless/i,
    /phantom/i, /selenium/i, /puppeteer/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) return "bot";
  }

  return "human";
}

export type TimeRange = "today" | "yesterday" | "7d" | "30d" | "custom";

export function getDateRange(range: TimeRange, customStart?: string, customEnd?: string) {
  const now = new Date();

  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    case "7d":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case "30d":
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case "custom":
      return {
        start: customStart ? startOfDay(new Date(customStart)) : startOfDay(subDays(now, 30)),
        end: customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now),
      };
    default:
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
  }
}

export async function getAnalyticsOverview(range: TimeRange, customStart?: string, customEnd?: string) {
  const { start, end } = getDateRange(range, customStart, customEnd);
  const payload = await getPayloadClient();

  const clicksWhere = {
    and: [
      { timestamp: { greater_than_equal: start.toISOString() } },
      { timestamp: { less_than_equal: end.toISOString() } },
    ],
  };

  const [totalClicks, humanClicks, clicks, humanClicksDoc, links] = await Promise.all([
    // Total clicks
    payload.count({ collection: "click-events", where: clicksWhere }),
    // Human clicks only
    payload.count({
      collection: "click-events",
      where: {
        and: [
          { timestamp: { greater_than_equal: start.toISOString() } },
          { timestamp: { less_than_equal: end.toISOString() } },
          { trafficType: { equals: "human" } },
        ],
      },
    }),
    // All clicks for grouping (limit to reasonable count)
    payload.find({
      collection: "click-events",
      depth: 0,
      where: clicksWhere,
      limit: 10000,
    }),
    // Human-only clicks for grouping
    payload.find({
      collection: "click-events",
      depth: 0,
      where: {
        and: [
          { timestamp: { greater_than_equal: start.toISOString() } },
          { timestamp: { less_than_equal: end.toISOString() } },
          { trafficType: { equals: "human" } },
        ],
      },
      limit: 10000,
    }),
    // All links for name resolution
    payload.find({
      collection: "redirect-links",
      depth: 0,
      limit: 10000,
      select: { name: true, slug: true },
    }),
  ]);

  const allClicks = clicks.docs;
  const humanOnlyClicks = humanClicksDoc.docs;
  const linkMap = new Map(links.docs.map((l) => [String(l.id), l]));

  // Top links by click count
  const linkCountMap = new Map<string, number>();
  for (const c of allClicks) {
    const linkId = String(c.link);
    linkCountMap.set(linkId, (linkCountMap.get(linkId) ?? 0) + 1);
  }
  const topLinks = [...linkCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([linkId, count]) => ({
      linkId,
      _count: { id: count },
      name: (linkMap.get(linkId)?.name as string) || "Unknown",
      slug: (linkMap.get(linkId)?.slug as string) || "unknown",
    }));

  // Top sources
  const sourceCountMap = new Map<string, number>();
  for (const c of allClicks) {
    const source = (c.utmSource as string) || "Direct";
    sourceCountMap.set(source, (sourceCountMap.get(source) ?? 0) + 1);
  }
  const topSources = [...sourceCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Top countries
  const countryCountMap = new Map<string, number>();
  for (const c of allClicks) {
    const country = (c.country as string) || "Unknown";
    countryCountMap.set(country, (countryCountMap.get(country) ?? 0) + 1);
  }
  const topCountries = [...countryCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Device breakdown
  const deviceCountMap = new Map<string, number>();
  for (const c of allClicks) {
    const device = (c.deviceType as string) || "Unknown";
    deviceCountMap.set(device, (deviceCountMap.get(device) ?? 0) + 1);
  }
  const deviceBreakdown = [...deviceCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([device, count]) => ({ device, count }));

  return {
    totalClicks: totalClicks.totalDocs,
    humanClicks: humanClicks.totalDocs,
    topLinks,
    topSources,
    topCountries,
    deviceBreakdown,
  };
}

export async function getClicksOverTime(range: TimeRange, customStart?: string, customEnd?: string) {
  const { start, end } = getDateRange(range, customStart, customEnd);
  const payload = await getPayloadClient();

  const clicks = await payload.find({
    collection: "click-events",
    depth: 0,
    where: {
      and: [
        { timestamp: { greater_than_equal: start.toISOString() } },
        { timestamp: { less_than_equal: end.toISOString() } },
      ],
    },
    select: { timestamp: true },
    limit: 10000,
  });

  // Group by date
  const grouped: Record<string, number> = {};
  for (const click of clicks.docs) {
    const date = format(new Date(click.timestamp as string), "yyyy-MM-dd");
    grouped[date] = (grouped[date] || 0) + 1;
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}