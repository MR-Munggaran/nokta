import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// ─── COUPLE NOTES / LETTERS ───────────────────────────────────────────────────

export const coupleNotes = pgTable("couple_notes", {
  id:        serial("id").primaryKey(),
  coupleId:  uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  authorId:  uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  content:   text("content").notNull(),
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