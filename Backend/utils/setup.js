import mongoose from "mongoose";
import connectDB from "./db.js";

const client = mongoose.connection.getClient();

export default async function setupDB() {
  await connectDB();
  const db = client.db();

  const usersSchema = {
    bsonType: "object",
    required: ["_id", "name", "password", "email", "storageDir", "__v"],
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
      __v: {
        bsonType: "int",
      },
    },
    additionalProperties: false,
  };

  const filesSchema = {
    bsonType: "object",
    required: ["_id", "name", "size", "parentDir", "extname", "user", "__v"],
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
      __v: {
        bsonType: "int",
      },
    },
    additionalProperties: false,
  };

  const directorySchema = {
    bsonType: "object",
    required: ["_id", "name", "user", "parentDir", "__v"],
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
      __v: {
        bsonType: "int",
      },
    },

    additionalProperties: false,
  };

  const collections = [
    { name: "users", schema: usersSchema },
    { name: "files", schema: filesSchema },
    { name: "directories", schema: directorySchema },
  ];

  try {
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
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }

  async function doesCollectionExist(collectionName) {
    const collection = await db
      .listCollections({ name: collectionName })
      .toArray();

    return collection.length > 0;
  }
}

setupDB();
