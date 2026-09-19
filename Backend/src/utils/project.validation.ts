import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must contain at least 2 characters")
    .max(100, "Project name is too long"),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must contain at least 2 characters")
    .max(100, "Project name is too long")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .nullable()
    .optional(),

  status: z
    .enum(["ACTIVE", "ARCHIVED"])
    .optional(),
});

export const connectRepositorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Repository name is required")
    .max(100, "Repository name is too long"),

  fullName: z
    .string()
    .trim()
    .min(1, "Repository full name is required")
    .max(255, "Repository name is too long"),

  url: z
    .string()
    .url("Repository URL must be valid"),

  externalId: z
    .string()
    .trim()
    .optional(),

  defaultBranch: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  branch: z
    .string()
    .trim()
    .max(100)
    .optional(),

  language: z
    .string()
    .trim()
    .max(100)
    .optional(),

  isPrivate: z
    .boolean()
    .optional(),
});