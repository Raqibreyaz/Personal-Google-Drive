import connectDB from "./db.js";

export default async function setupDB() {
  const db = await connectDB();

  const usersSchema = {
    bsonType: "object",
    required: ["_id", "name", "password", "email", "storageDir"],
    properties: {
      _id: {
        bsonType: "objectId",
      },
      name: {
        bsonType: "string",
        minLength: 3,
        description: "Directory name is required!",
      },
      password: {
        bsonType: "string",
        minLength: 4,
        description: "Password is required!",
      },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        description: "Email is required!",
      },
      storageDir: {
        bsonType: "objectId",
        description: "A storage directory must be assigned to the user",
      },
    },
    additionalProperties: false,
  };

  const filesSchema = {
    bsonType: "object",
    required: ["_id", "name", "size", "parentDir", "extname", "user"],
    properties: {
      _id: {
        bsonType: "objectId",
      },
      name: {
        bsonType: "string",
        minLength: 1,
        description: "Filename required!",
      },
      size: {
        bsonType: "long",
        description: "File size required!",
      },
      parentDir: {
        bsonType: "objectId",
        description: "Provide File's parent!",
      },
      extname: {
        bsonType: "string",
      },
      user: {
        bsonType: "objectId",
        description: "Provide the user of the file!",
      },
    },
    additionalProperties: false,
  };

  const directorySchema = {
    bsonType: "object",
    required: ["_id", "name", "user", "parentDir"],
    properties: {
      _id: {
        bsonType: "objectId",
      },
      name: {
        bsonType: "string",
        description: "Directory name is required!",
      },
      user: {
        bsonType: "objectId",
        description: "A user must be assigned to the directory",
      },
      parentDir: {
        bsonType: ["objectId", "null"],
      },
    },
    additionalProperties: false,
  };

  const collections = [
    { name: "users", schema: usersSchema },
    { name: "files", schema: filesSchema },
    { name: "directories", schema: directorySchema },
  ];

  for (const { name, schema } of collections) {
    const collectionExists = await doesCollectionExist(name);

    if (!collectionExists) {
      // Use createCollection method
      await db.createCollection(name, {
        validator: { $jsonSchema: schema },
        validationAction: "error",
        validationLevel: "strict",
      });
      console.log(`Created collection "${name}" with validation`);
    } else {
      // Use collMod command
      await db.command({
        collMod: name,
        validator: { $jsonSchema: schema },
        validationAction: "error",
        validationLevel: "strict",
      });
      console.log(`Updated validation for collection "${name}"`);
    }
  }

  return db;

  async function doesCollectionExist(collectionName) {
    const collection = await db
      .listCollections({ name: collectionName })
      .toArray();

    return collection.length > 0;
  }
}
