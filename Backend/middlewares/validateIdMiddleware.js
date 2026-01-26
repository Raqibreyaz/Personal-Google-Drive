import { ObjectId } from "mongodb";

const validateId = (req, res, next, id) => {
  if (!ObjectId.isValid(id))
    return res.status(400).json({ error: `Invalid ID: ${id}` });

  next();
};

export default validateId;
