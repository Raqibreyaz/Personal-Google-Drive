import { z } from "zod";

const getFileSchema = z.object({
  query: z
    .object({
      action: z.enum(["download"]).optional(),
    })
    .optional(),
});

export default getFileSchema;
