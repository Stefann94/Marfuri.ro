CREATE TABLE "cities" (
	"id" integer PRIMARY KEY NOT NULL,
	"country" char(2) NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"region" varchar(120),
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"population" integer DEFAULT 0 NOT NULL,
	"search" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" char(2) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_countries_code_fk" FOREIGN KEY ("country") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_country_pop_idx" ON "cities" USING btree ("country","population");--> statement-breakpoint
CREATE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");