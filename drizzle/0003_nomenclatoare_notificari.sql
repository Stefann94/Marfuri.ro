CREATE TABLE "company_kinds" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"label" varchar(40) NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" varchar(40) DEFAULT 'home' NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_company_id" integer NOT NULL,
	"to_company_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"kind" varchar(12) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"href" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_types" (
	"slug" varchar(30) PRIMARY KEY NOT NULL,
	"label" varchar(80) NOT NULL,
	"short" varchar(40) NOT NULL,
	"title" varchar(60) NOT NULL,
	"description" varchar(120) DEFAULT '' NOT NULL,
	"common" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tons" real,
	"name" varchar(40) NOT NULL,
	"sub" varchar(40) DEFAULT '' NOT NULL,
	"fill" real DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "popular" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "eu" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_company_id_companies_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_company_id_companies_id_fk" FOREIGN KEY ("to_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faqs_page_idx" ON "faqs" USING btree ("page","sort");--> statement-breakpoint
CREATE INDEX "messages_to_idx" ON "messages" USING btree ("to_company_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_company_idx" ON "notifications" USING btree ("company_id","created_at");