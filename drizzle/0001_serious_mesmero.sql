ALTER TABLE "access_shares" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "moments" ADD COLUMN "media_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "moments" ADD COLUMN "file_size_bytes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "access_shares" ADD CONSTRAINT "access_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;