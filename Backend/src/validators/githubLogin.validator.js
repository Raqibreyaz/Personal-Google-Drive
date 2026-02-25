import { z } from "zod";

const githubLoginSchema = z.object({
  query: z.object({
    state: z.string(),
    code: z.string(),
  }),
});

export default githubLoginSchema;
