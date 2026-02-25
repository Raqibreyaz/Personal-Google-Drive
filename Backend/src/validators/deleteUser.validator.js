import { z } from "zod";

const deleteUserSchema = z.object({
  query: z.object({ permanent: z.enum(["true", "false"]) }).optional(),
});

export default deleteUserSchema;
