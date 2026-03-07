import { z } from "zod";

export const createDirectorySchema = z.object({
  body: z.object({
    dirname: z.string().min(1),
  }),
});

export const renameDirectorySchema = z.object({
  body: z.object({
    newDirname: z.string().min(1),
  }),
});
