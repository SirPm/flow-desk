-- AlterTable
ALTER TABLE "workflow_templates" ADD COLUMN     "changeRequestFields" "ChangeRequestField"[] DEFAULT ARRAY[]::"ChangeRequestField"[];
