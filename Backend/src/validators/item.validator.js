import { z } from "zod";
import { ObjectId } from "mongodb";

export const bulkDeleteSchema = z.object({
  body: z
    .object({
      selectedDirs: z
        .array(
          z.string().refine((id) => ObjectId.isValid(id), {
            error: "Invalid MongoDB ObjectId",
          })
        )
        .optional()
        .default([]),
      selectedFiles: z
        .array(
          z.string().refine((id) => ObjectId.isValid(id), {
            error: "Invalid MongoDB ObjectId",
          })
        )
        .optional()
        .default([]),
    })
    .refine(
      (data) => data.selectedDirs.length > 0 || data.selectedFiles.length > 0,
      {
        error: "At least one directory or file must be selected for deletion",
      }
    ),
});
