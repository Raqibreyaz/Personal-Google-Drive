import { z } from "zod";
import dataSanitizer from "../helpers/dataSanitizer.js";

/**
 * A Zod string schema that validates and sanitizes input.
 * It uses a strict approach: if the sanitized version is different from the original,
 * it's considered invalid.
 */
export const strictSanitizedString = (fieldName = "Input") => 
  z.string({ required_error: `${fieldName} is required` })
    .min(1, { error: `${fieldName} cannot be empty` })
    .refine((val) => {
      const sanitized = dataSanitizer.sanitize(val);
      return sanitized === val;
    }, {
      error: `Invalid ${fieldName}: Contains disallowed characters or HTML tags`,
    });

/**
 * A Zod string schema that simply sanitizes the input.
 */
export const sanitizedString = (fieldName = "Input") => 
  z.string({ required_error: `${fieldName} is required` })
    .min(1, { error: `${fieldName} cannot be empty` })
    .transform((val) => dataSanitizer.sanitize(val));
