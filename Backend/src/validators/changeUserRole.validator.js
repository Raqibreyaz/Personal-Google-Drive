import { z } from "zod";
import Role from "../constants/role.js";

const changeUserRoleSchema = z.object({
  body: z.object({ role: z.enum(Object.values(Role)) }),
});

export default changeUserRoleSchema;
