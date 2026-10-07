CREATE TABLE "api_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fetch_jobs" (
	"account_id" bigint PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"heartbeat_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "player_matches" (
	"account_id" bigint NOT NULL,
	"match_id" bigint NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"duration_s" integer NOT NULL,
	"game_mode" text NOT NULL,
	"match_mode" text NOT NULL,
	"hero_id" integer NOT NULL,
	"won" boolean NOT NULL,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"net_worth" integer NOT NULL,
	"last_hits" integer NOT NULL,
	"denies" integer NOT NULL,
	"bullet_kills" integer NOT NULL,
	"ability_kills" integer NOT NULL,
	"melee_kills" integer NOT NULL,
	"headshot_kills" integer NOT NULL,
	"closeup_kills" integer NOT NULL,
	"long_distance_kills" integer NOT NULL,
	"shots_hit" integer NOT NULL,
	"shots_missed" integer NOT NULL,
	"hero_bullets_hit" integer NOT NULL,
	"hero_bullets_hit_crit" integer NOT NULL,
	"hero_shots" integer NOT NULL,
	"hero_hits" integer NOT NULL,
	"hero_headshots" integer NOT NULL,
	"parry_success" integer NOT NULL,
	"parry_miss" integer NOT NULL,
	"unspent_gold_minutes" integer NOT NULL,
	"breakables" integer NOT NULL,
	"sinner_jackpots" integer NOT NULL,
	"idols_returned" integer NOT NULL,
	"powerups_collected" integer NOT NULL,
	"player_damage" integer NOT NULL,
	"teammate_healing" integer NOT NULL,
	"boss_damage" integer NOT NULL,
	"mid_boss_claimed" integer NOT NULL,
	"mid_boss_stolen" integer NOT NULL,
	"death_positions" jsonb NOT NULL,
	CONSTRAINT "player_matches_account_id_match_id_pk" PRIMARY KEY("account_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"account_id" bigint PRIMARY KEY NOT NULL,
	"persona_name" text,
	"avatar_url" text,
	"profile_url" text,
	"rank_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "player_matches_match_id_idx" ON "player_matches" USING btree ("match_id");