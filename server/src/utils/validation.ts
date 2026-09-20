import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(200, "Task title is too long"),

  description: z
    .string()
    .trim()
    .max(2000, "Task description is too long")
    .optional(),

  projectId: z
    .string()
    .uuid("Invalid project ID"),

  developerId: z
    .string()
    .uuid("Invalid developer ID"),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .default("MEDIUM"),

  dueDate: z
    .string()
    .datetime("Invalid due date"),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
  ]),
});