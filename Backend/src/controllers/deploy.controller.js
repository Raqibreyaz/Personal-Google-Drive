import { spawn } from "node:child_process";
import redisClient from "../config/redis.js";
import verifyGithubWebhookSignature from "../helpers/verifyGithubWebhookSignature.js";

export const githubWebhook = async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const eventType = req.headers["x-github-event"];
  const deliveryId = req.headers["x-github-delivery"];

  console.log("verifying signature...");
  // reject malformed event
  if (!verifyGithubWebhookSignature(signature, req.body))
    return res.sendStatus(400);

  console.log("signature verified!!");

  // ignore non-push event
  if (eventType !== "push") {
    console.log("non push event received!");
    return res.sendStatus(200);
  }

  // return error for bad delivery id
  if (!deliveryId) return res.sendStatus(400);

  // ignore if the event already processed
  const inserted = await redisClient.set(`github:webhook:${deliveryId}`, "1", {
    expiration: { type: "EX", value: 60 * 15 },
    condition: "NX",
  });
  if (inserted === null) return res.sendStatus(200);

  const payload = JSON.parse(req.body.toString("utf-8"));

  console.log("checking backend changes...");

  const changedFiles = payload.commits.flatMap((commit) => [
    ...commit.added,
    ...commit.removed,
    ...commit.modified,
  ]);

  const hasChanges = changedFiles.some((f) => {
    const name = f.toLowerCase();
    return name.startsWith("backend/") && !name.endsWith(".md");
  });
  // skip if no changes done in backend
  if (!hasChanges) {
    console.log("no changes in backend, ignoring deployment!!");
    return res.sendStatus(200);
  }

  // do 'pnpm install' when package.json changed
  console.log("checking new packages installation requirement...");
  const shouldInstall = changedFiles.some((f) => {
    const name = f.toLowerCase();
    return name === "backend/package.json" || name === "backend/pnpm-lock.yaml";
  });

  if (!shouldInstall) console.log("no new package installation required!!");

  // sending early ACK to github
  res.sendStatus(200);

  // if (Object.entries(deliveryIds).length >= 5) deliveryIds = {};
  // deliveryIds[deliveryId] = true;

  const scriptPath =
    "/home/ubuntu/Personal-Google-Drive/Backend/scripts/deploy-backend.sh";

  const childProcess = spawn("bash", [scriptPath], {
    env: { ...process.env, SHOULD_INSTALL: String(shouldInstall) },
    stdio: "inherit",
  });

  childProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Script executed successfully!");
    } else console.log("Script failed!");
  });

  childProcess.on("error", (error) => {
    console.log("Error in spawning the process!", error);
  });
};
