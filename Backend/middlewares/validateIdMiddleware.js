const validateId = (req, res, next, id) => {
  if (id.length !== 24)
    return res.status(400).json({ error: `Invalid ID: ${id}` });

  next();
};

export default validateId;
