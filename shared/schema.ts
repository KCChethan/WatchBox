import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ip: text("ip").notNull().unique(),
  status: text("status").notNull().default("idle"), // idle, using, dnd
  version: text("version"),
  kernel: text("kernel"),
  build: text("build"),
  commit: text("commit"),
  description: text("description"),
  timestamp: text("timestamp"),
  uptime: text("uptime"),
  currentUser: text("current_user"),
  isOnline: integer("is_online").default(1), // 1 for online, 0 for offline
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const accessRequests = pgTable("access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  requesterName: text("requester_name").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, approved, denied, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

// Strongly-typed status enums (runtime validation)
export const deviceStatusEnum = z.enum(["idle", "using", "dnd"]);
export const accessRequestStatusEnum = z.enum(["pending", "approved", "denied", "dismissed"]);

export const insertDeviceSchema = createInsertSchema(devices).pick({
  ip: true,
});

export const updateDeviceStatusSchema = z.object({
  status: deviceStatusEnum,
  currentUser: z.string().trim().min(1).optional().nullable(),
});

export const insertAccessRequestSchema = z.object({
  deviceId: z.string().min(1),
  requesterName: z.string().trim().min(1),
  message: z.string().trim().optional().nullable(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type UpdateDeviceStatus = z.infer<typeof updateDeviceStatusSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
