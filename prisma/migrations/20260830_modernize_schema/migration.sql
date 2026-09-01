-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT,
    "pricingType" TEXT NOT NULL DEFAULT 'freemium',
    "categoryId" TEXT NOT NULL,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '',
    "hostingGuide" TEXT,
    "entityType" TEXT NOT NULL DEFAULT 'TOOL',
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "lastVerifiedAt" DATETIME,
    "sourceUrl" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tool" ("affiliateUrl", "categoryId", "createdAt", "description", "hostingGuide", "id", "isFeatured", "isPublished", "isSponsored", "logo", "name", "pricingType", "rating", "slug", "tags", "updatedAt", "websiteUrl") SELECT "affiliateUrl", "categoryId", "createdAt", "description", "hostingGuide", "id", "isFeatured", "isPublished", "isSponsored", "logo", "name", "pricingType", "rating", "slug", "tags", "updatedAt", "websiteUrl" FROM "Tool";
DROP TABLE "Tool";
ALTER TABLE "new_Tool" RENAME TO "Tool";
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");
CREATE INDEX "Tool_categoryId_idx" ON "Tool"("categoryId");
CREATE INDEX "Tool_isFeatured_idx" ON "Tool"("isFeatured");
CREATE INDEX "Tool_isPublished_idx" ON "Tool"("isPublished");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SearchQuery_normalized_idx" ON "SearchQuery"("normalized");

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

