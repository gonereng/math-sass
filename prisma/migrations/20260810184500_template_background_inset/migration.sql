-- AlterTable
ALTER TABLE "Template" ADD COLUMN "backgroundId" TEXT NOT NULL DEFAULT 'blank';
ALTER TABLE "Template" ADD COLUMN "contentInsetIn" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "backgroundId";
ALTER TABLE "Project" DROP COLUMN "contentInsetIn";
