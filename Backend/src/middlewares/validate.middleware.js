export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success)
      res.status(400).json({
        error: result.error.issues.map((issue) => issue.message).join(", "),
      });

    next();
  };
}
