import mongoose from "mongoose";

export default async function connectDB() {
  const mongodbUri =
    "mongodb://raquib:raquib@localhost:27017/storageApp?replicaSet=myReplicaSet&authSource=storageApp";
  await mongoose.connect(process.env.MONGODB_URI || mongodbUri);

  console.log("Database Connected!");
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Client Disconnected!");
  process.exit(0);
});
