import { z } from "zod";

const setAllowAnyoneSchema = z.object({
  body: z.object({
    permission: z.enum(["Edit", "View"]).nullable().optional(),
  }),
});

export default setAllowAnyoneSchema;
