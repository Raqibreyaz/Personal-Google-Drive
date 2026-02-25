import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Role from "../src/constants/role.js";
import Provider from "../src/constants/provider.js";

export default async function setupDB() {
  await connectDB();
  const client = mongoose.connection.getClient();
  const db = client.db();

  const usersSchema = {
    bsonType: "object",
    required: ["_id", "name", "email", "storageDir"],
    properties: {
      _id: {
        bsonType: "objectId",
      },
      name: {
        bsonType: "string",
        minLength: 3,
        description: "Directory name is required!",
      },
      authProvider: {
        bsonType: "string",
        enum: Object.values(Provider),
      },
      providerId: {
        bsonType: ["string", "null"],
      },
      picture: {
        bsonType: ["string", "null"],
      },
      role: {
        bsonType: "string",
        enum: Object.values(Role),
      },
      isDeleted: {
        bsonType: "bool",
      },
      password: {
        bsonType: ["string", "null"],
        minLength: 4,
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
      createdAt: {
        bsonType: "date",
      },
      updatedAt: {
        bsonType: "date",
      },
      __v: {
        bsonType: "int",
      },
    },
    additionalProperties: false,
  };

  const fileSchema = {
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
        bsonType: "int",
        description: "File size required!",
      },
      parentDir: {
        bsonType: "objectId",
        description: "Provide File's parent!",
      },
      extname: {
        bsonType: "string",
      },
      allowAnyoneAccess: {
        bsonType: ["string", "null"],
        enum: ["View", "Edit", null],
      },
      user: {
        bsonType: "objectId",
        description: "Provide the user of the file!",
      },
      createdAt: {
        bsonType: "date",
      },
      updatedAt: {
        bsonType: "date",
      },
      __v: {
        bsonType: "int",
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
      createdAt: {
        bsonType: "date",
      },
      updatedAt: {
        bsonType: "date",
      },
      __v: {
        bsonType: "int",
      },
    },

    additionalProperties: false,
  };

  const fileShareSchema = {
    bsonType: "object",
    required: ["_id", "file", "user", "permission"],
    properties: {
      _id: {
        bsonType: "objectId",
      },
      file: {
        bsonType: "objectId",
        description: "file reference is required!",
      },
      user: {
        bsonType: "objectId",
        description: "A user reference is required!",
      },
      permission: {
        bsonType: "string",
        enum: ["Edit", "View"],
      },
      __v: {
        bsonType: "int",
      },
    },

    additionalProperties: false,
  };

  const collections = [
    { name: "users", schema: usersSchema },
    { name: "files", schema: fileSchema },
    { name: "directories", schema: directorySchema },
    { name: "fileshares", schema: fileShareSchema },
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
