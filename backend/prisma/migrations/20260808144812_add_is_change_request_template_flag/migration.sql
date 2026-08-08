-- AlterTable
ALTER TABLE "workflow_templates" ADD COLUMN     "isChangeRequestTemplate" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any template that is *currently* an organization's active change-request default
-- must remain eligible, otherwise this migration would silently break existing configuration.
UPDATE "workflow_templates"
SET "isChangeRequestTemplate" = true
WHERE "id" IN (
  SELECT "changeRequestTemplateId" FROM "organizations" WHERE "changeRequestTemplateId" IS NOT NULL
);
