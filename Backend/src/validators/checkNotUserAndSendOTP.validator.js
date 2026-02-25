import { z } from "zod";

const checkNotUserAndSendOTPSchema = z.object({
  body: z.object({ email: z.email() }),
});

export default checkNotUserAndSendOTPSchema;
