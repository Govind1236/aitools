import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsOverview, getClicksOverTime, TimeRange } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "30d") as TimeRange;
  const customStart = url.searchParams.get("start") || undefined;
  const customEnd = url.searchParams.get("end") || undefined;

  try {
    const [overview, clicksOverTime] = await Promise.all([
      getAnalyticsOverview(range, customStart, customEnd),
      getClicksOverTime(range, customStart, customEnd),
    ]);

    return NextResponse.json({
      overview,
      clicksOverTime,
      range,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
