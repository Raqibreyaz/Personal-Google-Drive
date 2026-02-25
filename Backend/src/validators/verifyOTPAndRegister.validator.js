import { z } from "zod";

const verifyOTPAndRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    password: z.string().min(6).max(10),
    email: z.email(),
    otp: z.string().length(4).regex(/^\d{4}$/),
  }),
});

export default verifyOTPAndRegisterSchema;
