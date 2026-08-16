ALTER TABLE "usuarios" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "invite_token" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "invite_token_expira_en" timestamp;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_invite_token_unique" UNIQUE("invite_token");