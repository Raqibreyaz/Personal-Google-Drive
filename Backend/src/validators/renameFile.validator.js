import { z } from "zod";

const renameFileSchema = z.object({
  body: z.object({
    newFilename: z.string().min(1),
  }),
});

export default renameFileSchema;
