-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "aiConfidence" INTEGER,
ADD COLUMN     "aiExplanation" TEXT,
ADD COLUMN     "aiImpact" TEXT,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiRecommendation" TEXT,
ADD COLUMN     "aiReviewedAt" TIMESTAMP(3),
ADD COLUMN     "aiRootCause" TEXT,
ADD COLUMN     "aiSuggestedFix" TEXT;
