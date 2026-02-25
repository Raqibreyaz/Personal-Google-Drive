import mongoose from "mongoose";

export default async function connectDB() {
  console.log("Database connection requested!");
  const mongodbUri = "mongodb://raquib:raquib@localhost:27017/storageApp";
  return mongoose.connect(process.env.MONGODB_URI || mongodbUri);
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Client Disconnected!");
  process.exit(0);
});
