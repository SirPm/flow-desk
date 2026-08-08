-- Existing change_requests rows predate the approval-engine link and have no backing
-- ApprovalRequest to satisfy the new required approvalRequestId column. This is local
-- dev/demo data (seeded, not real user data) and prisma/seed.ts now recreates these rows
-- with a proper backing ApprovalRequest, so it's safe to clear the table here.
DELETE FROM "change_requests";

-- AlterTable
ALTER TABLE "change_requests" ADD COLUMN     "approvalRequestId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "changeRequestTemplateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "change_requests_approvalRequestId_key" ON "change_requests"("approvalRequestId");

-- CreateIndex
CREATE INDEX "organizations_changeRequestTemplateId_idx" ON "organizations"("changeRequestTemplateId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_changeRequestTemplateId_fkey" FOREIGN KEY ("changeRequestTemplateId") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
