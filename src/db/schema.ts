import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, jsonb, real, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("student"), // student | owner | admin
  status: text("status").notNull().default("active"), // active | suspended
  university: text("university").notNull().default(""),
  faculty: text("faculty").notNull().default(""),
  city: text("city").notNull().default("دمياط"),
  isVerified: boolean("is_verified").notNull().default(false),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  city: text("city").notNull().default("دمياط"),
  neighborhood: text("neighborhood").notNull().default(""),
  university: text("university").notNull().default(""),
  distanceKm: real("distance_km").notNull().default(1),
  type: text("type").notNull().default("شقة كاملة"),
  gender: text("gender").notNull().default("الكل"),
  addressNote: text("address_note").notNull().default("يتم مشاركة العنوان الدقيق بعد تأكيد الحجز"),
  status: text("status").notNull().default("draft"), // draft pending_review verification_required published paused rejected suspended archived
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
  rules: text("rules").notNull().default(""),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  views: integer("views").notNull().default(0),
  rejectReason: text("reject_reason").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unitType: text("unit_type").notNull().default("غرفة خاصة"), // سرير في غرفة مشتركة | غرفة خاصة | شقة كاملة | استوديو
  totalBeds: integer("total_beds").notNull().default(1),
  capacity: integer("capacity").notNull().default(1),
  monthlyPrice: integer("monthly_price").notNull().default(0), // EGP integer; owners must enter the real price
  deposit: integer("deposit").notNull().default(0),
  cleaningFee: integer("cleaning_fee").notNull().default(0),
  semesterDiscountPct: integer("semester_discount_pct").notNull().default(0),
  availableFrom: text("available_from").notNull().default(sql`CURRENT_DATE::text`),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guests: integer("guests").notNull().default(1),
  status: text("status").notNull().default("pending_owner"),
  rentSubtotal: integer("rent_subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  serviceFee: integer("service_fee").notNull().default(0),
  cleaningFee: integer("cleaning_fee").notNull().default(0),
  depositAmount: integer("deposit_amount").notNull().default(0),
  total: integer("total").notNull().default(0),
  payableNow: integer("payable_now").notNull().default(0),
  remaining: integer("remaining").notNull().default(0),
  platformFee: integer("platform_fee").notNull().default(0),
  refundAmount: integer("refund_amount").notNull().default(0),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull().default({}),
  history: jsonb("history").$type<{ status: string; at: string; by: string; note?: string }[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  cancelReason: text("cancel_reason").notNull().default(""),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  method: text("method").notNull().default("غير محدد"),
  provider: text("provider").notNull().default("unconfigured"),
  status: text("status").notNull().default("pending"), // pending succeeded failed refunded partially_refunded
  ref: text("ref").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  type: text("type").notNull().default("ملكية العقار"),
  evidenceNote: text("evidence_note").notNull().default(""),
  documentName: text("document_name").notNull().default(""),
  status: text("status").notNull().default("pending"),
  reviewerId: integer("reviewer_id"),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull().default(5),
  text: text("text").notNull().default(""),
  ownerResponse: text("owner_response").notNull().default(""),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("fav_uq").on(t.userId, t.propertyId)]);
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  lastText: text("last_text").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  type: text("type").notNull().default("general"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const roommateProfiles = pgTable("roommate_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  city: text("city").notNull().default(""),
  university: text("university").notNull().default(""),
  budget: integer("budget").notNull().default(0),
  moveIn: text("move_in").notNull().default(sql`CURRENT_DATE::text`),
  durationMonths: integer("duration_months").notNull().default(0),
  gender: text("gender").notNull().default(""),
  prefs: jsonb("prefs").$type<Record<string, string>>().notNull().default({}),
  bio: text("bio").notNull().default(""),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const roommateRequests = pgTable("roommate_requests", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toId: integer("to_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  message: text("message").notNull().default(""),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("عام"),
  subject: text("subject").notNull(),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("open"),
  reply: text("reply").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  reason: text("reason").notNull().default("معلومات غير دقيقة"),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id"),
  actorName: text("actor_name").notNull().default("system"),
  action: text("action").notNull(),
  target: text("target").notNull().default(""),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  q: text("q").notNull(),
  a: text("a").notNull(),
  sort: integer("sort").notNull().default(0),
});
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
