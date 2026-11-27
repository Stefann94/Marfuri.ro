import { pgTable, serial, integer, varchar, char, text, real, date, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

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

/** Nomenclator: țările din bursă (nume în română), în ordinea în care le arătăm. */
export const countries = pgTable("countries", {
  code: char("code", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  sort: integer("sort").notNull().default(100),
  /** destinație populară din/spre România: apare în subsol, pe prima pagină și în rutele indexate mereu */
  popular: boolean("popular").notNull().default(false),
  /** țară din Uniunea Europeană (pentru textele despre documente și cabotaj) */
  eu: boolean("eu").notNull().default(false),
});

/** Nomenclator: localități (din GeoNames), cu regiunea, coordonatele și un câmp de căutare fără diacritice. */
export const cities = pgTable(
  "cities",
  {
    id: integer("id").primaryKey(),
    country: char("country", { length: 2 }).notNull().references(() => countries.code, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    region: varchar("region", { length: 120 }),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    population: integer("population").notNull().default(0),
    /** numele + variante (ASCII, alte limbi), normalizate: „cluj napoca cluj klausenburg …” */
    search: text("search").notNull(),
    /** orașele cu pagină proprie (/orase/…) și folosite la datele de exemplu */
    featured: boolean("featured").notNull().default(false),
  },
  (t) => [index("cities_country_pop_idx").on(t.country, t.population), index("cities_slug_idx").on(t.slug)],
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

/** Nomenclator: tipurile de camion (prelată, frigorific…), cu textele din căutare și ordinea. */
export const vehicleTypes = pgTable("vehicle_types", {
  slug: varchar("slug", { length: 30 }).primaryKey(),
  /** numele complet: „Prelată standard (13,6 m)” */
  label: varchar("label", { length: 80 }).notNull(),
  /** numele scurt, în liste și carduri: „Prelată” */
  short: varchar("short", { length: 40 }).notNull(),
  /** numele din fereastra „Camion” din căutare: „Prelată standard” */
  title: varchar("title", { length: 60 }).notNull(),
  /** explicația de sub nume: „13,6 m · până la 24 t” */
  description: varchar("description", { length: 120 }).notNull().default(""),
  /** tipurile cele mai folosite: apar primele (în căutare și în filtre) */
  common: boolean("common").notNull().default(false),
  sort: integer("sort").notNull().default(100),
});

/** Nomenclator: treptele de greutate din căutare („până la 3,5 t · dubă”). */
export const weightClasses = pgTable("weight_classes", {
  id: serial("id").primaryKey(),
  /** tone; gol = „Oricât” */
  tons: real("tons"),
  name: varchar("name", { length: 40 }).notNull(),
  sub: varchar("sub", { length: 40 }).notNull().default(""),
  /** cât din bara mică e plină (0–1) */
  fill: real("fill").notNull().default(0),
  sort: integer("sort").notNull().default(100),
});

/** Nomenclator: tipurile de firmă. */
export const companyKinds = pgTable("company_kinds", {
  code: varchar("code", { length: 20 }).primaryKey(),
  label: varchar("label", { length: 40 }).notNull(),
  sort: integer("sort").notNull().default(100),
});

/** Întrebările frecvente, pe pagini (deocamdată prima pagină: „home”). */
export const faqs = pgTable(
  "faqs",
  {
    id: serial("id").primaryKey(),
    page: varchar("page", { length: 40 }).notNull().default("home"),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sort: integer("sort").notNull().default(100),
  },
  (t) => [index("faqs_page_idx").on(t.page, t.sort)],
);

/** Notificările unei firme (marfă nouă pe rută, acceptări, documente care expiră, evaluări). */
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    /** load | offer | doc | rating */
    kind: varchar("kind", { length: 12 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull().default(""),
    href: varchar("href", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("notifications_company_idx").on(t.companyId, t.createdAt)],
);

/** Mesaje între firme. */
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    fromCompanyId: integer("from_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    toCompanyId: integer("to_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("messages_to_idx").on(t.toCompanyId, t.readAt)],
);

export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type CityRow = typeof cities.$inferSelect;
export type Load = typeof loads.$inferSelect;
export type Truck = typeof trucks.$inferSelect;
