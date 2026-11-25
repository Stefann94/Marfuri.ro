CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"name" varchar(160) NOT NULL,
	"vat_code" varchar(20),
	"reg_number" varchar(40),
	"kind" varchar(20) DEFAULT 'carrier' NOT NULL,
	"country" char(2) NOT NULL,
	"city" varchar(80) NOT NULL,
	"address" text,
	"phone" varchar(40),
	"email" varchar(160),
	"website" varchar(200),
	"description" text,
	"fleet_size" integer,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "loads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"from_country" char(2) NOT NULL,
	"from_city" varchar(80) NOT NULL,
	"from_city_slug" varchar(80) NOT NULL,
	"from_lat" real,
	"from_lng" real,
	"to_country" char(2) NOT NULL,
	"to_city" varchar(80) NOT NULL,
	"to_city_slug" varchar(80) NOT NULL,
	"to_lat" real,
	"to_lng" real,
	"load_date" date NOT NULL,
	"unload_date" date,
	"vehicle" varchar(30) NOT NULL,
	"weight_t" real,
	"ldm" real,
	"volume_m3" real,
	"goods" varchar(160),
	"price" integer,
	"currency" char(3) DEFAULT 'EUR' NOT NULL,
	"notes" text,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trucks" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"from_country" char(2) NOT NULL,
	"from_city" varchar(80) NOT NULL,
	"from_city_slug" varchar(80) NOT NULL,
	"from_lat" real,
	"from_lng" real,
	"to_country" char(2),
	"to_city" varchar(80),
	"to_city_slug" varchar(80),
	"available_from" date NOT NULL,
	"available_to" date,
	"vehicle" varchar(30) NOT NULL,
	"capacity_t" real,
	"ldm" real,
	"notes" text,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_vat_idx" ON "companies" USING btree ("vat_code");--> statement-breakpoint
CREATE INDEX "loads_route_idx" ON "loads" USING btree ("status","from_country","to_country","load_date");--> statement-breakpoint
CREATE INDEX "loads_date_idx" ON "loads" USING btree ("status","load_date");--> statement-breakpoint
CREATE INDEX "loads_from_city_idx" ON "loads" USING btree ("from_city_slug");--> statement-breakpoint
CREATE INDEX "loads_to_city_idx" ON "loads" USING btree ("to_city_slug");--> statement-breakpoint
CREATE INDEX "loads_company_idx" ON "loads" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "trucks_route_idx" ON "trucks" USING btree ("status","from_country","to_country","available_from");--> statement-breakpoint
CREATE INDEX "trucks_date_idx" ON "trucks" USING btree ("status","available_from");--> statement-breakpoint
CREATE INDEX "trucks_from_city_idx" ON "trucks" USING btree ("from_city_slug");--> statement-breakpoint
CREATE INDEX "trucks_company_idx" ON "trucks" USING btree ("company_id");