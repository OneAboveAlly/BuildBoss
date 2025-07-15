/*
  Warnings:

  - You are about to drop the column `senderUserId` on the `admin_message_replies` table. All the data in the column will be lost.
  - You are about to drop the column `senderUserId` on the `admin_messages` table. All the data in the column will be lost.
  - Added the required column `senderId` to the `admin_message_replies` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `senderType` on the `admin_message_replies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `senderId` to the `admin_messages` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `senderType` on the `admin_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "admin_message_replies" DROP CONSTRAINT "admin_message_replies_senderAdminId_fkey";

-- DropForeignKey
ALTER TABLE "admin_message_replies" DROP CONSTRAINT "admin_message_replies_senderUserId_fkey";

-- DropForeignKey
ALTER TABLE "admin_messages" DROP CONSTRAINT "admin_messages_senderAdminId_fkey";

-- DropForeignKey
ALTER TABLE "admin_messages" DROP CONSTRAINT "admin_messages_senderUserId_fkey";

-- AlterTable
ALTER TABLE "admin_message_replies" DROP COLUMN "senderUserId",
ADD COLUMN     "senderId" TEXT NOT NULL,
DROP COLUMN "senderType",
ADD COLUMN     "senderType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "admin_messages" DROP COLUMN "senderUserId",
ADD COLUMN     "senderId" TEXT NOT NULL,
DROP COLUMN "senderType",
ADD COLUMN     "senderType" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SenderType";

-- AddForeignKey
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_senderAdminId_fkey" FOREIGN KEY ("senderAdminId") REFERENCES "plans_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_message_replies" ADD CONSTRAINT "admin_message_replies_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_message_replies" ADD CONSTRAINT "admin_message_replies_senderAdminId_fkey" FOREIGN KEY ("senderAdminId") REFERENCES "plans_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
