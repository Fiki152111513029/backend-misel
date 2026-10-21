-- Raw AGV reports from RCS, kept for inspection in ICS Logs > AGV Logs.
CREATE TABLE "agv_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "deviceCode" TEXT,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agv_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agv_logs_createdAt_idx" ON "agv_logs"("createdAt");
CREATE INDEX "agv_logs_deviceCode_idx" ON "agv_logs"("deviceCode");
