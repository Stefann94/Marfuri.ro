import { and, count, desc, eq, gte, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { companies, loads, trucks, users } from "@/db/schema";
import type { Filters } from "./queries";
import { slugify } from "./text";

export const LIST_SIZE = 20;

/* Cereri „Caută camion” = mărfuri (loads) deschise; cereri „Caută marfă” = camioane (trucks) deschise. */

const openLoad = () => and(eq(loads.status, "active"), gte(loads.loadDate, sql`current_date - 1`));
const openTruck = () =>
  and(eq(trucks.status, "active"), or(gte(trucks.availableFrom, sql`current_date - 1`), gte(trucks.availableTo, sql`current_date`)));

export type ListFilters = Pick<Filters, "from" | "to" | "fromCity" | "toCity" | "date" | "vehicle" | "weight"> & { verified?: boolean; page: number };

export async function listOpenLoads(f: ListFilters) {
  const w: (SQL | undefined)[] = [openLoad()];
  if (f.from) w.push(eq(loads.fromCountry, f.from));
  if (f.to) w.push(eq(loads.toCountry, f.to));
  if (f.fromCity) w.push(sql`${loads.fromCitySlug} like ${slugify(f.fromCity) + "%"}`);
  if (f.toCity) w.push(sql`${loads.toCitySlug} like ${slugify(f.toCity) + "%"}`);
  if (f.date) w.push(gte(loads.loadDate, f.date));
  if (f.vehicle) w.push(eq(loads.vehicle, f.vehicle));
  if (f.weight) w.push(sql`${loads.weightT} <= ${f.weight}`);
  if (f.verified) w.push(sql`${companies.verifiedAt} is not null`);
  const where = and(...w);
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: loads.id,
        companyId: loads.companyId,
        fromCountry: loads.fromCountry,
        fromCity: loads.fromCity,
        toCountry: loads.toCountry,
        toCity: loads.toCity,
        loadDate: loads.loadDate,
        vehicle: loads.vehicle,
        weightT: loads.weightT,
        ldm: loads.ldm,
        goods: loads.goods,
        price: loads.price,
        currency: loads.currency,
        createdAt: loads.createdAt,
        companyName: companies.name,
        verified: sql<boolean>`${companies.verifiedAt} is not null`,
      })
      .from(loads)
      .innerJoin(companies, eq(companies.id, loads.companyId))
      .where(where)
      .orderBy(desc(loads.createdAt))
      .limit(LIST_SIZE)
      .offset((f.page - 1) * LIST_SIZE),
    db.select({ total: count() }).from(loads).innerJoin(companies, eq(companies.id, loads.companyId)).where(where),
  ]);
  return { items, total };
}

export async function listOpenTrucks(f: ListFilters) {
  const w: (SQL | undefined)[] = [openTruck()];
  if (f.from) w.push(eq(trucks.fromCountry, f.from));
  if (f.to) w.push(or(eq(trucks.toCountry, f.to), sql`${trucks.toCountry} is null`));
  if (f.fromCity) w.push(sql`${trucks.fromCitySlug} like ${slugify(f.fromCity) + "%"}`);
  if (f.toCity) w.push(or(sql`${trucks.toCitySlug} like ${slugify(f.toCity) + "%"}`, sql`${trucks.toCitySlug} is null`));
  if (f.date) w.push(sql`coalesce(${trucks.availableTo}, ${trucks.availableFrom}) >= ${f.date}::date`);
  if (f.vehicle) w.push(eq(trucks.vehicle, f.vehicle));
  if (f.weight) w.push(or(sql`${trucks.capacityT} >= ${f.weight}`, sql`${trucks.capacityT} is null`));
  if (f.verified) w.push(sql`${companies.verifiedAt} is not null`);
  const where = and(...w);
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: trucks.id,
        companyId: trucks.companyId,
        fromCountry: trucks.fromCountry,
        fromCity: trucks.fromCity,
        toCountry: trucks.toCountry,
        toCity: trucks.toCity,
        availableFrom: trucks.availableFrom,
        availableTo: trucks.availableTo,
        vehicle: trucks.vehicle,
        capacityT: trucks.capacityT,
        ldm: trucks.ldm,
        createdAt: trucks.createdAt,
        companyName: companies.name,
        verified: sql<boolean>`${companies.verifiedAt} is not null`,
      })
      .from(trucks)
      .innerJoin(companies, eq(companies.id, trucks.companyId))
      .where(where)
      .orderBy(desc(trucks.createdAt))
      .limit(LIST_SIZE)
      .offset((f.page - 1) * LIST_SIZE),
    db.select({ total: count() }).from(trucks).innerJoin(companies, eq(companies.id, trucks.companyId)).where(where),
  ]);
  return { items, total };
}

/* ------------------------------------------------------------ contul meu */

const accCo = alias(companies, "acc_co");
const accUser = alias(users, "acc_user");
const ownCo = alias(companies, "own_co");

/** Ce a publicat firma mea, cu cine a acceptat (și cum îl contactez). */
export async function myPublished(companyId: number) {
  const [ls, ts] = await Promise.all([
    db
      .select({
        id: loads.id,
        fromCity: loads.fromCity,
        fromCountry: loads.fromCountry,
        toCity: loads.toCity,
        toCountry: loads.toCountry,
        date: loads.loadDate,
        vehicle: loads.vehicle,
        weightT: loads.weightT,
        price: loads.price,
        status: loads.status,
        createdAt: loads.createdAt,
        acceptedAt: loads.acceptedAt,
        acceptNote: loads.acceptNote,
        acceptPrice: loads.acceptPrice,
        accCompany: accCo.name,
        accVerified: sql<boolean>`${accCo.verifiedAt} is not null`,
        accName: accUser.name,
        accPhone: accUser.phone,
        accEmail: accUser.email,
      })
      .from(loads)
      .leftJoin(accCo, eq(accCo.id, loads.acceptedByCompanyId))
      .leftJoin(accUser, eq(accUser.id, loads.acceptedByUserId))
      .where(and(eq(loads.companyId, companyId), ne(loads.status, "deleted")))
      .orderBy(desc(loads.createdAt))
      .limit(50),
    db
      .select({
        id: trucks.id,
        fromCity: trucks.fromCity,
        fromCountry: trucks.fromCountry,
        toCity: trucks.toCity,
        toCountry: trucks.toCountry,
        date: trucks.availableFrom,
        vehicle: trucks.vehicle,
        capacityT: trucks.capacityT,
        status: trucks.status,
        createdAt: trucks.createdAt,
        acceptedAt: trucks.acceptedAt,
        acceptNote: trucks.acceptNote,
        acceptPrice: trucks.acceptPrice,
        accCompany: accCo.name,
        accVerified: sql<boolean>`${accCo.verifiedAt} is not null`,
        accName: accUser.name,
        accPhone: accUser.phone,
        accEmail: accUser.email,
      })
      .from(trucks)
      .leftJoin(accCo, eq(accCo.id, trucks.acceptedByCompanyId))
      .leftJoin(accUser, eq(accUser.id, trucks.acceptedByUserId))
      .where(and(eq(trucks.companyId, companyId), ne(trucks.status, "deleted")))
      .orderBy(desc(trucks.createdAt))
      .limit(50),
  ]);
  return { loads: ls, trucks: ts };
}

/** Ce a acceptat firma mea, cu datele celui care a publicat. */
export async function myAccepted(companyId: number) {
  const [ls, ts] = await Promise.all([
    db
      .select({
        id: loads.id,
        fromCity: loads.fromCity,
        fromCountry: loads.fromCountry,
        toCity: loads.toCity,
        toCountry: loads.toCountry,
        date: loads.loadDate,
        vehicle: loads.vehicle,
        weightT: loads.weightT,
        price: loads.price,
        acceptedAt: loads.acceptedAt,
        acceptNote: loads.acceptNote,
        acceptPrice: loads.acceptPrice,
        company: ownCo.name,
        verified: sql<boolean>`${ownCo.verifiedAt} is not null`,
        contactName: loads.contactName,
        contactPhone: sql<string | null>`coalesce(${loads.contactPhone}, ${ownCo.phone})`,
      })
      .from(loads)
      .innerJoin(ownCo, eq(ownCo.id, loads.companyId))
      .where(and(eq(loads.acceptedByCompanyId, companyId), eq(loads.status, "accepted")))
      .orderBy(desc(loads.acceptedAt))
      .limit(50),
    db
      .select({
        id: trucks.id,
        fromCity: trucks.fromCity,
        fromCountry: trucks.fromCountry,
        toCity: trucks.toCity,
        toCountry: trucks.toCountry,
        date: trucks.availableFrom,
        vehicle: trucks.vehicle,
        capacityT: trucks.capacityT,
        acceptedAt: trucks.acceptedAt,
        acceptNote: trucks.acceptNote,
        acceptPrice: trucks.acceptPrice,
        company: ownCo.name,
        verified: sql<boolean>`${ownCo.verifiedAt} is not null`,
        contactName: trucks.contactName,
        contactPhone: sql<string | null>`coalesce(${trucks.contactPhone}, ${ownCo.phone})`,
      })
      .from(trucks)
      .innerJoin(ownCo, eq(ownCo.id, trucks.companyId))
      .where(and(eq(trucks.acceptedByCompanyId, companyId), eq(trucks.status, "accepted")))
      .orderBy(desc(trucks.acceptedAt))
      .limit(50),
  ]);
  return { loads: ls, trucks: ts };
}

/** Mărfurile mele încă deschise (pentru „Acceptă camionul”: ce marfă îi trimit). */
export function myOpenLoads(companyId: number) {
  return db
    .select({ id: loads.id, fromCity: loads.fromCity, toCity: loads.toCity, loadDate: loads.loadDate, weightT: loads.weightT })
    .from(loads)
    .where(and(eq(loads.companyId, companyId), openLoad()))
    .orderBy(desc(loads.createdAt))
    .limit(20);
}
