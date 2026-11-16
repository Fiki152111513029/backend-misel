-- AlterTable
-- Nullable with no default: every existing Model Code Process keeps
-- having no timer, so nothing starts continuing tasks on its own until an
-- admin sets a number.
ALTER TABLE "model_code_processes" ADD COLUMN "continueTaskDelaySec" INTEGER;
