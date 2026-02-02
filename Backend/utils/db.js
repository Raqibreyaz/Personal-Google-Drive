import mongoose from "mongoose";

export default async function connectDB() {
  mongoose.connect("mongodb://raquib:raquib@localhost:27017/storageApp");
  console.log("Database connection requested!");
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Client Disconnected!");
  process.exit(0);
});
