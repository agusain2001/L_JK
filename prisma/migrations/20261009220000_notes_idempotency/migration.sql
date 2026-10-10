ALTER TABLE "PrivateMessage" ADD COLUMN "submissionKey" TEXT;
CREATE UNIQUE INDEX "PrivateMessage_submissionKey_key" ON "PrivateMessage"("submissionKey");
