import ApiError from "../helpers/apiError.js";
import { VALIDATION_FAILED } from "../constants/errorCodes.js";

export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      throw new ApiError(
        400,
        result.error.issues.map((issue) => issue.message).join(", "),
        VALIDATION_FAILED,
      );
    }

    next();
  };
}
