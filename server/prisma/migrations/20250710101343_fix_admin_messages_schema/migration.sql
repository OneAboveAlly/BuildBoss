/*
  Warnings:

  - Changed the type of `senderType` on the `admin_message_replies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `senderType` on the `admin_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "admin_message_replies" ALTER COLUMN "senderId" DROP NOT NULL,
DROP COLUMN "senderType",
ADD COLUMN     "senderType" "SenderType" NOT NULL;

-- AlterTable
ALTER TABLE "admin_messages" ALTER COLUMN "senderId" DROP NOT NULL,
DROP COLUMN "senderType",
ADD COLUMN     "senderType" "SenderType" NOT NULL;
