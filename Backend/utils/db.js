import mongoose from "mongoose";

export default async function connectDB() {
  console.log("Database connection requested!");
  return mongoose.connect("mongodb://raquib:raquib@localhost:27017/storageApp");
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Client Disconnected!");
  process.exit(0);
});
