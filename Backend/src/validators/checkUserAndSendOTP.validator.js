import { z } from "zod";

const checkUserAndSendOTPSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6).max(10),
  }),
});

export default checkUserAndSendOTPSchema;
