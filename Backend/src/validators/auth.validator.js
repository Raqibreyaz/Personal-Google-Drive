import { z } from "zod";

export const checkUserAndSendOTPSchema = z.object({
  body: z.object({ email: z.email() }),
});

export const checkUserWithPasswordAndSendOTPSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6).max(10),
  }),
});

export const verifyOTPAndRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    password: z.string().min(6).max(10),
    email: z.email(),
    otp: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  }),
});

export const verifyOTPAndLoginSchema = z.object({
  body: z.object({
    email: z.email(),
    otp: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string(),
  }),
});

export const githubLoginSchema = z.object({
  query: z.object({
    state: z.string(),
    code: z.string(),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    otp: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
    newPassword: z.string().min(6).max(10),
  }),
});
