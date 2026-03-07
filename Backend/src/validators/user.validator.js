import { z } from "zod";
import Role from "../constants/role.js";

export const deleteUserSchema = z.object({
  query: z.object({ permanent: z.enum(["true", "false"]) }).optional(),
});

export const changeUserRoleSchema = z.object({
  body: z.object({ role: z.enum(Object.values(Role)) }),
});
