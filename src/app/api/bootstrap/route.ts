import { NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, properties, units, bookings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensurePrimaryAdmin } from "@/lib/seed";
import { currentUser, getSettings, publicUser } from "@/lib/server";
export async function GET() {
  try {
    await ensurePrimaryAdmin();
    const [settings, faqList, me, pubs, allUnits, conf] = await Promise.all([
      getSettings(), db.select().from(faqs).orderBy(asc(faqs.sort)), currentUser(),
      db.select().from(properties).where(eq(properties.status, "published")),
      db.select().from(units), db.select().from(bookings).where(eq(bookings.status, "confirmed")),
    ]);
    const beds = allUnits.filter(u => pubs.some(p => p.id === u.propertyId)).reduce((a, u) => a + u.totalBeds, 0);
    const verifiedCount = pubs.filter(p => p.isVerified).length;
    const cities = [...new Set(pubs.map(p => p.city))];
    const cityStats = cities.map(c => ({ city: c, count: pubs.filter(p => p.city === c).length }));
    return NextResponse.json({ settings, faqs: faqList, me: me ? publicUser(me) : null, stats: { published: pubs.length, beds, verifiedCount, confirmedBookings: conf.length, cityStats } });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
