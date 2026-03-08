import { createClient } from "redis";

const redisUrl = process.env.REDIS_URI || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (error) => {
  console.log(error);
});

await redisClient.connect();
console.log("Memory Store Connected!");

process.on("SIGINT", async () => {
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;
