import { z } from "zod";

export const getFileSchema = z.object({
  query: z
    .object({
      action: z.enum(["download"]).optional(),
    })
    .optional(),
});

export const renameFileSchema = z.object({
  body: z.object({
    newFilename: z.string().min(1),
  }),
});

export const setAllowAnyoneSchema = z.object({
  body: z.object({
    permission: z.enum(["Edit", "View"]).nullable().optional(),
  }),
});
