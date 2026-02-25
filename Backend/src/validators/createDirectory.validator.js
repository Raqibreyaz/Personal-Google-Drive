import { z } from "zod";

const createDirectorySchema = z.object({
  body: z.object({
    dirname: z.string().min(1),
  }),
});

export default createDirectorySchema;
