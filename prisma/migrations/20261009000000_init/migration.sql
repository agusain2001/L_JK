CREATE TABLE "Memory" (
"id" TEXT NOT NULL PRIMARY KEY, "kind" TEXT NOT NULL DEFAULT 'image',
"title" TEXT NOT NULL DEFAULT '', "caption" TEXT NOT NULL DEFAULT '', "description" TEXT NOT NULL DEFAULT '',
"mediaUrl" TEXT NOT NULL, "thumbnailUrl" TEXT, "sourceUrl" TEXT, "date" TEXT, "location" TEXT,
"tags" TEXT NOT NULL DEFAULT '[]', "featured" BOOLEAN NOT NULL DEFAULT false, "approved" BOOLEAN NOT NULL DEFAULT false,
"order" INTEGER NOT NULL DEFAULT 0, "chapter" TEXT NOT NULL DEFAULT 'memories',
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Memory_mediaUrl_key" ON "Memory"("mediaUrl");
