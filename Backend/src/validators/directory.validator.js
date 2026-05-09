import { z } from "zod";
import { strictSanitizedString } from "./common.validator.js";

export const createDirectorySchema = z.object({
  body: z.object({
    dirname: strictSanitizedString("Directory name"),
  }),
});

export const renameDirectorySchema = z.object({
  body: z.object({
    newDirname: strictSanitizedString("Directory name"),
  }),
});
