import { z } from "zod";

export const connectGitHubRepositorySchema =
  z.object({
    repositoryId: z.coerce
      .number()
      .int()
      .positive(),
  });