import { z } from "zod";

export const shareFileSchema = z.object({
  body: z.object({
    userEmail: z.email(),
    permission: z.enum(["Edit", "View"]),
  }),
});

export const revokeFileAccessSchema = z.object({
  body: z.object({
    userEmail: z.email(),
  }),
});
