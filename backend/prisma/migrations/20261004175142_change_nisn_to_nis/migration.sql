/*
  Warnings:

  - You are about to drop the column `nisn` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nis]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nis` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_nisn_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "nisn",
ADD COLUMN     "nis" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");
