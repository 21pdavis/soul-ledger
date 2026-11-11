CREATE TABLE "shared_stories" (
	"slug" text PRIMARY KEY NOT NULL,
	"account_id" bigint NOT NULL,
	"content_hash" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shared_stories_content_hash_idx" ON "shared_stories" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "shared_stories_expires_at_idx" ON "shared_stories" USING btree ("expires_at");