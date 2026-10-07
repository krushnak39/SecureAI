-- CreateEnum
CREATE TYPE "PRRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PRMergeReadiness" AS ENUM ('READY', 'REVIEW_REQUIRED', 'BLOCKED');

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "mergeReadiness" "PRMergeReadiness",
ADD COLUMN     "pullRequestId" TEXT,
ADD COLUMN     "riskLevel" "PRRiskLevel",
ADD COLUMN     "riskScore" INTEGER;

-- CreateIndex
CREATE INDEX "Analysis_pullRequestId_idx" ON "Analysis"("pullRequestId");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
