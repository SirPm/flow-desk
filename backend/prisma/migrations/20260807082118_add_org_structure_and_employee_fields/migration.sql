/*
  Warnings:

  - Changed the type of `fieldChanged` on the `change_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ChangeRequestField" AS ENUM ('POSITION', 'DEPARTMENT', 'SALARY', 'EMPLOYMENT_TYPE');

-- This project's change_requests rows are all upserted demo/seed data (see prisma/seed.ts),
-- not real user data, so we clear them here rather than attempt a lossy cast from free-text
-- fieldChanged/oldValue/newValue strings to the new enum + id-based semantics. `prisma db seed`
-- repopulates them immediately after this migration runs.
DELETE FROM "change_requests";

-- AlterTable
ALTER TABLE "change_requests" DROP COLUMN "fieldChanged",
ADD COLUMN     "fieldChanged" "ChangeRequestField" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "employmentType" "EmploymentType",
ADD COLUMN     "positionId" TEXT,
ADD COLUMN     "salary" INTEGER;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_organizationId_name_key" ON "departments"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_organizationId_title_key" ON "positions"("organizationId", "title");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_positionId_idx" ON "users"("positionId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
