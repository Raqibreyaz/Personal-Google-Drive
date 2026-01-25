import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/storageApp");

export default async function connectDB() {
  await client.connect();
  console.log("Database connected!");
  return client.db();
}

process.on("SIGINT", async () => {
  await client.close();
  console.log("Client Disconnected!");
  process.exit(0);
});
