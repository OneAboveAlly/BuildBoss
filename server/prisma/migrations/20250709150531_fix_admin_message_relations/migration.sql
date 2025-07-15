-- DropForeignKey
ALTER TABLE "admin_message_replies" DROP CONSTRAINT "admin_message_replies_senderId_fkey";

-- DropForeignKey
ALTER TABLE "admin_messages" DROP CONSTRAINT "admin_messages_senderId_fkey";

-- AddForeignKey
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "plans_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_message_replies" ADD CONSTRAINT "admin_message_replies_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "plans_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
