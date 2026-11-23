ALTER TABLE "Report" ADD COLUMN "commentId" TEXT REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Report_reporterId_commentId_key" ON "Report"("reporterId", "commentId");
