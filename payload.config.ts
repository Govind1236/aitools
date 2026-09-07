import path from "path";

import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig } from "payload";

import { Categories } from "./src/collections/Categories.ts";
import { ClickEvents } from "./src/collections/ClickEvents.ts";
import { Campaigns } from "./src/collections/Campaigns.ts";
import { GeoRoutes } from "./src/collections/GeoRoutes.ts";
import { Providers } from "./src/collections/Providers.ts";
import { RedirectLinks } from "./src/collections/RedirectLinks.ts";
import { SearchQueries } from "./src/collections/SearchQueries.ts";
import { Sessions } from "./src/collections/Sessions.ts";
import { Tags } from "./src/collections/Tags.ts";
import { Tools } from "./src/collections/Tools.ts";
import { Users } from "./src/collections/Users.ts";
import { guardPayloadInitialization } from "./src/lib/catalog/payload-init-guard.ts";

const rawSqliteDb = sqliteAdapter({
  // Payload's own database lives at payload/payload.db — never prisma/dev.db.
  client: {
    url: process.env.PAYLOAD_DATABASE_URL ?? "file:./payload/payload.db",
  },
});

// Narrow compatibility wrapper around the SQLite adapter factory: attaches a
// rejection handler to every adapter's internal `initializing` gate so a
// Payload DB outage surfaces as a normal getPayload() rejection (handled by
// the catalog repository's Prisma fallback) instead of an
// ERR_UNHANDLED_REJECTION that terminates the Node process.
// See src/lib/catalog/payload-init-guard.ts for the full analysis.
const sqliteDb = {
  ...rawSqliteDb,
  init(initArgs: Parameters<typeof rawSqliteDb.init>[0]) {
    return guardPayloadInitialization(rawSqliteDb.init(initArgs));
  },
};

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(process.cwd(), "src/app/(payload)"),
      importMapFile: path.resolve(
        process.cwd(),
        "src/app/(payload)/admin/importMap.js",
      ),
    },
    meta: {
      titleSuffix: " — Payload CMS (PoC)",
    },
  },
  collections: [
    Users,
    Sessions,
    Providers,
    Categories,
    Tags,
    Tools,
    Campaigns,
    RedirectLinks,
    ClickEvents,
    GeoRoutes,
    SearchQueries,
  ],
  db: sqliteDb,
  routes: {
    admin: "/cms",
    api: "/cms/api",
    graphQL: "/cms/graphql",
    graphQLPlayground: "/cms/graphql-playground",
  },
  secret:
    process.env.PAYLOAD_SECRET ||
    "payload-poc-local-only-secret-not-for-production",
  typescript: {
    outputFile: path.resolve(process.cwd(), "src/payload-types.ts"),
  },
});