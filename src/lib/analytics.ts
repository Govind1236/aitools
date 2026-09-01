import { db } from "./db";
import { UAParser } from "ua-parser-js";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from "date-fns";

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

  const click = await db.clickEvent.create({
    data: {
      linkId: data.linkId,
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
      trafficType,
      isSuspicious: trafficType !== "human",
      ipAddress: data.ipAddress || null,
    },
  });

  // Increment click count on the link
  await db.redirectLink.update({
    where: { id: data.linkId },
    data: { clickCount: { increment: 1 } },
  });

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

  const [totalClicks, humanClicks, topLinks, topSources, topCountries, deviceBreakdown] =
    await Promise.all([
      // Total clicks
      db.clickEvent.count({
        where: { timestamp: { gte: start, lte: end } },
      }),
      // Human clicks only
      db.clickEvent.count({
        where: { timestamp: { gte: start, lte: end }, trafficType: "human" },
      }),
      // Top links
      db.clickEvent.groupBy({
        by: ["linkId"],
        where: { timestamp: { gte: start, lte: end } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Top sources
      db.clickEvent.groupBy({
        by: ["utmSource"],
        where: { timestamp: { gte: start, lte: end }, utmSource: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Top countries
      db.clickEvent.groupBy({
        by: ["country"],
        where: { timestamp: { gte: start, lte: end }, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Device breakdown
      db.clickEvent.groupBy({
        by: ["deviceType"],
        where: { timestamp: { gte: start, lte: end } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

  // Resolve link names
  const linkIds = topLinks.map((t) => t.linkId);
  const links = await db.redirectLink.findMany({
    where: { id: { in: linkIds } },
    select: { id: true, name: true, slug: true },
  });
  const linkMap = new Map(links.map((l) => [l.id, l]));

  return {
    totalClicks,
    humanClicks,
    topLinks: topLinks.map((t) => ({
      ...t,
      name: linkMap.get(t.linkId)?.name || "Unknown",
      slug: linkMap.get(t.linkId)?.slug || "unknown",
    })),
    topSources: topSources.map((s) => ({
      source: s.utmSource || "Direct",
      count: s._count.id,
    })),
    topCountries: topCountries.map((c) => ({
      country: c.country || "Unknown",
      count: c._count.id,
    })),
    deviceBreakdown: deviceBreakdown.map((d) => ({
      device: d.deviceType || "Unknown",
      count: d._count.id,
    })),
  };
}

export async function getClicksOverTime(range: TimeRange, customStart?: string, customEnd?: string) {
  const { start, end } = getDateRange(range, customStart, customEnd);

  const clicks = await db.clickEvent.findMany({
    where: { timestamp: { gte: start, lte: end } },
    select: { timestamp: true },
    orderBy: { timestamp: "asc" },
  });

  // Group by date
  const grouped: Record<string, number> = {};
  for (const click of clicks) {
    const date = format(click.timestamp, "yyyy-MM-dd");
    grouped[date] = (grouped[date] || 0) + 1;
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}
