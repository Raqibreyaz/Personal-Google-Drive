import { z } from "zod";

const revokeFileAccessSchema = z.object({
  body: z.object({
    userEmail: z.email(),
  }),
});

export default revokeFileAccessSchema;
