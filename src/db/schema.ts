import { pgTable, serial, integer, varchar, char, text, real, date, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

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

/** Conturi: o persoană care lucrează pentru o firmă (identificată prin CUI). */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_company_idx").on(t.companyId)],
);

/** Sesiuni de autentificare (în cookie stă doar tokenul; aici, hash-ul lui). */
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
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
    /** cine a publicat (cont) și pe cine să sune cel care acceptă */
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    contactName: varchar("contact_name", { length: 120 }),
    contactPhone: varchar("contact_phone", { length: 40 }),
    /** acceptare: status trece din „active” în „accepted” */
    acceptedByCompanyId: integer("accepted_by_company_id").references(() => companies.id, { onDelete: "set null" }),
    acceptedByUserId: integer("accepted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptNote: text("accept_note"),
    acceptPrice: integer("accept_price"),
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
    /** cine a publicat (cont) și pe cine să sune cel care acceptă */
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    contactName: varchar("contact_name", { length: 120 }),
    contactPhone: varchar("contact_phone", { length: 40 }),
    /** acceptare: status trece din „active” în „accepted” */
    acceptedByCompanyId: integer("accepted_by_company_id").references(() => companies.id, { onDelete: "set null" }),
    acceptedByUserId: integer("accepted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptNote: text("accept_note"),
    acceptPrice: integer("accept_price"),
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
export type User = typeof users.$inferSelect;
export type Load = typeof loads.$inferSelect;
export type Truck = typeof trucks.$inferSelect;
