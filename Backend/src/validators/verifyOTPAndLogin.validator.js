import { z } from "zod";

const verifyOTPAndLoginSchema = z.object({
  body: z.object({
    email: z.email(),
    otp: z.string().length(4),
  }),
});

export default verifyOTPAndLoginSchema;
