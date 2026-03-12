import Directory from "../models/directory.model.js";

export default async function updateParentSize(
  parentId,
  size,
  session = undefined,
) {
  let volatileParentId = parentId;

  let transaction = {};
  if (session) transaction.session = session;

  while (volatileParentId && size !== 0) {
    const volatileParent = await Directory.findByIdAndUpdate(
      volatileParentId,
      {
        $inc: { size },
      },
      transaction,
    ).lean();

    volatileParentId = volatileParent?.parentDir;
  }
}
