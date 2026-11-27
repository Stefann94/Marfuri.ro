CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"company_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "contact_name" varchar(120);--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "contact_phone" varchar(40);--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "accepted_by_company_id" integer;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "accepted_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "accept_note" text;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "accept_price" integer;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "contact_name" varchar(120);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "contact_phone" varchar(40);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "accepted_by_company_id" integer;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "accepted_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "accept_note" text;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "accept_price" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_accepted_by_company_id_companies_id_fk" FOREIGN KEY ("accepted_by_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_accepted_by_company_id_companies_id_fk" FOREIGN KEY ("accepted_by_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;