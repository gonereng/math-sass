-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "problemTypeId" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE INDEX "TemplateItem_templateId_boxId_sortOrder_idx" ON "TemplateItem"("templateId", "boxId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
