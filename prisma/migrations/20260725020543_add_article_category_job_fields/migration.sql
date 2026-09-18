-- AlterTable
ALTER TABLE "public"."Article" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'life';

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "area" TEXT NOT NULL DEFAULT '杨林地区',
ADD COLUMN     "jobType" TEXT NOT NULL DEFAULT 'fulltime',
ADD COLUMN     "salary" TEXT NOT NULL DEFAULT '面议';
