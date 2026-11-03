import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, settingsTable, users } from "@/db/schema";
import { getSettings, hashPassword } from "./server";

const ADMIN_PERMISSIONS = [
  "users.read",
  "users.suspend",
  "listings.review",
  "verification.review",
  "bookings.read",
  "payments.read",
  "refunds.initiate",
  "content.manage",
  "settings.manage",
  "staff.permissions.manage",
  "audit.read",
];

async function rotateAdminPassword(userId: number, password: string, version: string) {
  await getSettings();
  return db.transaction(async tx => {
    const [row] = await tx.select({ data: settingsTable.data }).from(settingsTable).where(eq(settingsTable.id, 1));
    const data = (row?.data || {}) as Record<string, unknown>;
    if (data.adminPasswordVersion === version) return false;
    await tx.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.update(settingsTable)
      .set({ data: { ...data, adminPasswordVersion: version }, updatedAt: new Date() })
      .where(eq(settingsTable.id, 1));
    return true;
  });
}

export async function ensurePrimaryAdmin() {
  const email = process.env.SAKANI_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SAKANI_ADMIN_PASSWORD;
  const passwordVersion = process.env.SAKANI_ADMIN_PASSWORD_VERSION?.trim();

  if (!email || !password) return false;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("SAKANI_ADMIN_EMAIL is not a valid email address");
  }
  if (password.length < 8) {
    throw new Error("SAKANI_ADMIN_PASSWORD must contain at least 8 characters");
  }

  const [existing] = await db
    .select({ id: users.id, role: users.role, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("Configured platform administrator email belongs to a non-admin account");
    }
    return passwordVersion ? rotateAdminPassword(existing.id, password, passwordVersion) : false;
  }

  const [created] = await db
    .insert(users)
    .values({
      name: "مدير المنصة",
      email,
      phone: "",
      passwordHash: hashPassword(password),
      role: "admin",
      permissions: ADMIN_PERMISSIONS,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (!created) return false;
  if (passwordVersion) await rotateAdminPassword(created.id, password, passwordVersion);
  return true;
}
