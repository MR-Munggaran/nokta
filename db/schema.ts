import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const eventCategoryEnum = pgEnum("event_category", [
  "work",
  "date",
  "health",
  "personal",
  "other",
]);

// ─── COUPLES ──────────────────────────────────────────────────────────────────

export const couples = pgTable("couples", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  inviteCode:         text("invite_code").notNull().unique(),
  masterPasswordSalt: text("master_password_salt").notNull(),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:        uuid("id").primaryKey(), // references auth.users.id
  email:     text("email").notNull().unique(),
  name:      text("name").notNull(),
  avatarUrl: text("avatar_url"),
  coupleId:  uuid("couple_id").references(() => couples.id, { onDelete: "set null" }),
  role:      text("role", { enum: ["owner", "partner"] }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── VAULT ITEMS ──────────────────────────────────────────────────────────────

export const vaultItems = pgTable("vault_items", {
  id:            serial("id").primaryKey(),
  coupleId:      uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  ownerId:       uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:          text("type", { enum: ["credential", "document", "note"] }).notNull(),
  name:          text("name").notNull(),
  encryptedData: text("encrypted_data").notNull(),
  iv:            text("iv").notNull(),
  authTag:       text("auth_tag").notNull(),
  shared:        boolean("shared").notNull().default(false),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── BUCKET LIST ──────────────────────────────────────────────────────────────

export const bucketListItems = pgTable("bucket_list_items", {
  id:          serial("id").primaryKey(),
  coupleId:    uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  createdBy:   uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:       text("title").notNull(),
  image: text("image"), // nullable by default
  description: text("description"),
  category:    text("category").notNull().default("general"),
  completed:   boolean("completed").notNull().default(false),
  completedBy: uuid("completed_by").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── SPECIAL DATES ────────────────────────────────────────────────────────────

export const specialDates = pgTable("special_dates", {
  id:              serial("id").primaryKey(),
  coupleId:        uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  title:           text("title").notNull(),
  emoji:           text("emoji").notNull().default("🗓️"),
  date:            date("date").notNull(),
  recurringYearly: boolean("recurring_yearly").notNull().default(true),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── HABITS ───────────────────────────────────────────────────────────────────

export const habits = pgTable("habits", {
  id:        serial("id").primaryKey(),
  coupleId:  uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  emoji:     text("emoji").notNull().default("✅"),
  frequency: text("frequency", { enum: ["daily", "weekly"] }).notNull().default("daily"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const habitLogs = pgTable("habit_logs", {
  id:       serial("id").primaryKey(),
  habitId:  integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId:   uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date:     date("date").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── MOOD CHECK-INS ───────────────────────────────────────────────────────────

export const moodCheckins = pgTable("mood_checkins", {
  id:        serial("id").primaryKey(),
  coupleId:  uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodScore: integer("mood_score").notNull(), // 1–5
  emoji:     text("emoji").notNull(),
  note:      text("note"),
  date:      date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moments = pgTable("moments", {
  id:         serial("id").primaryKey(),
  coupleId:   uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }), 
  uploaderId: uuid("uploader_id").notNull().references(() => users.id),
  imageUrl:   text("image_url").notNull(),
  caption:    text("caption"),
  date:       timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const momentImages = pgTable("moment_images", {
  id:        serial("id").primaryKey(),
  momentId:  integer("moment_id").notNull().references(() => moments.id, { onDelete: "cascade" }),
  imageUrl:  text("image_url").notNull(),
  order:     integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── COUPLE NOTES / LETTERS ───────────────────────────────────────────────────

export const coupleNotes = pgTable("couple_notes", {
  id:        serial("id").primaryKey(),
  coupleId:  uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  authorId:  uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  content:   text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const couplesRelations = relations(couples, ({ many }) => ({
  users:           many(users),
  vaultItems:      many(vaultItems),
  bucketListItems: many(bucketListItems),
  specialDates:    many(specialDates),
  habits:          many(habits),
  moodCheckins:    many(moodCheckins),
  coupleNotes:     many(coupleNotes),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  couple:          one(couples, { fields: [users.coupleId], references: [couples.id] }),
  vaultItems:      many(vaultItems),
  habitLogs:       many(habitLogs),
  moodCheckins:    many(moodCheckins),
  coupleNotes:     many(coupleNotes),
}));

export const vaultItemsRelations = relations(vaultItems, ({ one }) => ({
  couple: one(couples, { fields: [vaultItems.coupleId], references: [couples.id] }),
  owner:  one(users,   { fields: [vaultItems.ownerId],  references: [users.id] }),
}));

export const bucketListRelations = relations(bucketListItems, ({ one }) => ({
  couple:    one(couples, { fields: [bucketListItems.coupleId],    references: [couples.id] }),
  creator:   one(users,   { fields: [bucketListItems.createdBy],   references: [users.id] }),
  completer: one(users,   { fields: [bucketListItems.completedBy], references: [users.id] }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  couple:  one(couples, { fields: [habits.coupleId],  references: [couples.id] }),
  creator: one(users,   { fields: [habits.createdBy], references: [users.id] }),
  logs:    many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
  user:  one(users,  { fields: [habitLogs.userId],  references: [users.id] }),
}));

export const moodCheckinsRelations = relations(moodCheckins, ({ one }) => ({
  couple: one(couples, { fields: [moodCheckins.coupleId], references: [couples.id] }),
  user:   one(users,   { fields: [moodCheckins.userId],   references: [users.id] }),
}));

export const coupleNotesRelations = relations(coupleNotes, ({ one }) => ({
  couple: one(couples, { fields: [coupleNotes.coupleId], references: [couples.id] }),
  author: one(users,   { fields: [coupleNotes.authorId], references: [users.id] }),
}));

export const momentsRelations = relations(moments, ({ one, many }) => ({
  uploader: one(users, { fields: [moments.uploaderId], references: [users.id] }),
  images:   many(momentImages),
}));

export const momentImagesRelations = relations(momentImages, ({ one }) => ({
  moment: one(moments, { fields: [momentImages.momentId], references: [moments.id] }),
}));


 
export type EventCategory = (typeof eventCategoryEnum.enumValues)[number];
 
// ─── TABLE ────────────────────────────────────────────────────────────────────
 
export const scheduleEvents = pgTable("schedule_events", {
  id:         serial("id").primaryKey(),
  coupleId:   uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  createdBy:  uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title:      text("title").notNull(),
  category:   eventCategoryEnum("category").notNull().default("other"),
  eventDate:  date("event_date").notNull(),
  startTime:  text("start_time").notNull(),
  endTime:    text("end_time"),
  note:       text("note"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
 
// ─── TYPES ────────────────────────────────────────────────────────────────────
 
export type ScheduleEvent    = typeof scheduleEvents.$inferSelect;
export type NewScheduleEvent = typeof scheduleEvents.$inferInsert;
 
// ─── RELATIONS (add to your existing relations block) ─────────────────────────
 
export const scheduleEventsRelations = relations(scheduleEvents, ({ one }) => ({
  couple: one(couples, { fields: [scheduleEvents.coupleId], references: [couples.id] }),
  creator: one(users,  { fields: [scheduleEvents.createdBy],  references: [users.id]  }),
}));