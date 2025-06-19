import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  // Chats table
  chats: defineTable({
    title: v.string(),
    userId: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_visibility", ["visibility"]),

  // Messages table
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    parts: v.optional(v.array(v.any())), // For AI SDK message parts
    experimental_attachments: v.optional(v.array(v.any())),
    annotations: v.optional(v.array(v.any())),
    createdAt: v.number(),
    userId: v.optional(v.string()),
  })
    .index("by_chat", ["chatId"])
    .index("by_chat_and_created", ["chatId", "createdAt"]),

  // User settings table
  userSettings: defineTable({
    userId: v.string(),
    preferences: v.object({
      name: v.optional(v.string()),
      occupation: v.optional(v.string()),
      traits: v.optional(v.array(v.string())),
      boringTheme: v.optional(v.boolean()),
      hidePersonalInfo: v.optional(v.boolean()),
      disableThematicBreaks: v.optional(v.boolean()),
      statsForNerds: v.optional(v.boolean()),
      mainFont: v.optional(v.string()),
      codeFont: v.optional(v.string()),
    }),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
}); 