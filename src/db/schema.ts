import { pgTable, serial, integer, varchar, char, text, real, date, timestamp, index } from "drizzle-orm/pg-core";

/** Firme: transportatori, expeditori (proprietari de marfă) și case de expediții. */
export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    vatCode: varchar("vat_code", { length: 20 }),
    regNumber: varchar("reg_number", { length: 40 }),
    kind: varchar("kind", { length: 20 }).notNull().default("carrier"),
    country: char("country", { length: 2 }).notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 160 }),
    website: varchar("website", { length: 200 }),
    description: text("description"),
    fleetSize: integer("fleet_size"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("companies_vat_idx").on(t.vatCode)],
);

/** Oferte de marfă: cineva are marfă și caută camion. */
export const loads = pgTable(
  "loads",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    fromCountry: char("from_country", { length: 2 }).notNull(),
    fromCity: varchar("from_city", { length: 80 }).notNull(),
    fromCitySlug: varchar("from_city_slug", { length: 80 }).notNull(),
    fromLat: real("from_lat"),
    fromLng: real("from_lng"),
    toCountry: char("to_country", { length: 2 }).notNull(),
    toCity: varchar("to_city", { length: 80 }).notNull(),
    toCitySlug: varchar("to_city_slug", { length: 80 }).notNull(),
    toLat: real("to_lat"),
    toLng: real("to_lng"),
    loadDate: date("load_date", { mode: "string" }).notNull(),
    unloadDate: date("unload_date", { mode: "string" }),
    vehicle: varchar("vehicle", { length: 30 }).notNull(),
    weightT: real("weight_t"),
    ldm: real("ldm"),
    volumeM3: real("volume_m3"),
    goods: varchar("goods", { length: 160 }),
    price: integer("price"),
    currency: char("currency", { length: 3 }).notNull().default("EUR"),
    notes: text("notes"),
    status: varchar("status", { length: 12 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("loads_route_idx").on(t.status, t.fromCountry, t.toCountry, t.loadDate),
    index("loads_date_idx").on(t.status, t.loadDate),
    index("loads_from_city_idx").on(t.fromCitySlug),
    index("loads_to_city_idx").on(t.toCitySlug),
    index("loads_company_idx").on(t.companyId),
  ],
);

/** Camioane libere: un transportator are capacitate disponibilă. */
export const trucks = pgTable(
  "trucks",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    fromCountry: char("from_country", { length: 2 }).notNull(),
    fromCity: varchar("from_city", { length: 80 }).notNull(),
    fromCitySlug: varchar("from_city_slug", { length: 80 }).notNull(),
    fromLat: real("from_lat"),
    fromLng: real("from_lng"),
    /** null = orice destinație */
    toCountry: char("to_country", { length: 2 }),
    toCity: varchar("to_city", { length: 80 }),
    toCitySlug: varchar("to_city_slug", { length: 80 }),
    availableFrom: date("available_from", { mode: "string" }).notNull(),
    availableTo: date("available_to", { mode: "string" }),
    vehicle: varchar("vehicle", { length: 30 }).notNull(),
    capacityT: real("capacity_t"),
    ldm: real("ldm"),
    notes: text("notes"),
    status: varchar("status", { length: 12 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trucks_route_idx").on(t.status, t.fromCountry, t.toCountry, t.availableFrom),
    index("trucks_date_idx").on(t.status, t.availableFrom),
    index("trucks_from_city_idx").on(t.fromCitySlug),
    index("trucks_company_idx").on(t.companyId),
  ],
);

export type Company = typeof companies.$inferSelect;
export type Load = typeof loads.$inferSelect;
export type Truck = typeof trucks.$inferSelect;
