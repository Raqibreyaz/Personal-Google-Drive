import { z } from "zod";

const shareFileSchema = z.object({
  body: z.object({
    userEmail: z.email(),
    permission: z.enum(["Edit", "View"]),
  }),
});

export default shareFileSchema;
