-- Dodanie enuma SenderType
CREATE TYPE "SenderType" AS ENUM ('USER', 'ADMIN');

-- Dodanie nowych kolumn do admin_messages
ALTER TABLE "admin_messages" ADD COLUMN "senderType" "SenderType";
ALTER TABLE "admin_messages" ADD COLUMN "senderUserId" TEXT;
ALTER TABLE "admin_messages" ADD COLUMN "senderAdminId" TEXT;

-- Przepisanie istniejących danych (zakładamy, że stare senderId to user)
UPDATE "admin_messages" SET "senderType" = 'USER', "senderUserId" = "senderId";

-- Usunięcie starego klucza obcego i kolumny senderId
ALTER TABLE "admin_messages" DROP CONSTRAINT IF EXISTS "admin_messages_senderId_fkey";
ALTER TABLE "admin_messages" DROP COLUMN "senderId";

-- Dodanie nowych kluczy obcych
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_senderAdminId_fkey" FOREIGN KEY ("senderAdminId") REFERENCES "plans_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kolumna senderType NOT NULL
ALTER TABLE "admin_messages" ALTER COLUMN "senderType" SET NOT NULL;

-- Analogicznie dla admin_message_replies
ALTER TABLE "admin_message_replies" ADD COLUMN "senderType" "SenderType";
ALTER TABLE "admin_message_replies" ADD COLUMN "senderUserId" TEXT;
ALTER TABLE "admin_message_replies" ADD COLUMN "senderAdminId" TEXT;

UPDATE "admin_message_replies" SET "senderType" = 'USER', "senderUserId" = "senderId";

ALTER TABLE "admin_message_replies" DROP CONSTRAINT IF EXISTS "admin_message_replies_senderId_fkey";
ALTER TABLE "admin_message_replies" DROP COLUMN "senderId";

ALTER TABLE "admin_message_replies" ADD CONSTRAINT "admin_message_replies_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_message_replies" ADD CONSTRAINT "admin_message_replies_senderAdminId_fkey" FOREIGN KEY ("senderAdminId") REFERENCES "plans_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_message_replies" ALTER COLUMN "senderType" SET NOT NULL;
