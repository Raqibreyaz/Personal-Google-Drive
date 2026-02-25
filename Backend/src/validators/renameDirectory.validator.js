import { z } from "zod";

const renameDirectorySchema = z.object({
  body: z.object({
    newDirname: z.string().min(1),
  }),
});

export default renameDirectorySchema;
