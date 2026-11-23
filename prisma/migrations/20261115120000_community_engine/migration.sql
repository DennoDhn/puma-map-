ALTER TABLE "User" ADD COLUMN "notifyComments" BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN "notifyReplies" BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN "notifySubscriptions" BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN "notifyReactions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Content" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT,
 ADD COLUMN "removed" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
ALTER TABLE "Notification" ADD COLUMN "contentId" TEXT,
 ADD COLUMN "eventKey" TEXT,
 ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");
CREATE INDEX "Notification_contentId_idx" ON "Notification"("contentId");
CREATE TABLE "Subscription" (
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "contentId" TEXT NOT NULL REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("userId","contentId")
);
CREATE INDEX "Subscription_contentId_idx" ON "Subscription"("contentId");
CREATE INDEX "Content_forum_order_idx" ON "Content"("kind","status","pinned","createdAt","id");
