import { NextResponse } from "next/server";

import { getProviderFromPayload } from "@/lib/providers/provider-repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * Isolated Payload PoC read endpoint.
 * Returns a Provider from Payload to prove the Payload Local API works.
 * Does NOT touch the existing /tools, /go, or /admin behavior.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { slug } = await ctx.params;
    const provider = await getProviderFromPayload(slug);
    if (!provider) {
      return NextResponse.json({ error: "provider not found" }, { status: 404 });
    }
    return NextResponse.json({
      source: "payload",
      provider: {
        name: provider.name,
        slug: provider.slug,
        legacyPrismaId: provider.legacyPrismaId ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "payload read failed", message },
      { status: 500 },
    );
  }
}