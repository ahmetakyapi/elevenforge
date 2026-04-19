CREATE TABLE "transfer_wishlist" (
	"club_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_unique" UNIQUE("club_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "transfer_wishlist" ADD CONSTRAINT "transfer_wishlist_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_wishlist" ADD CONSTRAINT "transfer_wishlist_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wishlist_club_idx" ON "transfer_wishlist" USING btree ("club_id");