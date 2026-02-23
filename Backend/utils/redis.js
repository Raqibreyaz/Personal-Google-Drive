import { randomUUID } from "node:crypto";
import { createClient, SCHEMA_FIELD_TYPE } from "redis";

export const redisClient = await createClient().connect();

const indexes = await redisClient.ft._list();
if (!indexes.includes("userIdx"))
  await redisClient.ft.create(
    "userIdx",
    {
      "$.userId": { type: SCHEMA_FIELD_TYPE.TAG, AS: "userId" },
    },
    { ON: "JSON", PREFIX: "session:" },
  );

// check if there are sessions exists for that user
// if yes then increment session count, else create and add count=1
export const createUserSession = async (userId, ttl) => {
  const sessionId = randomUUID();
  const key = `session:${sessionId}`;

  await redisClient.json.set(key, "$", { userId });
  await redisClient.expire(key, ttl ?? 3600);

   return sessionId;
};

export const getUserSession = async (sessionId) => {
  return await redisClient.json.get(`session:${sessionId}`);
};

// check if there is a session exist for the user
export const checkSessionExist = async (userId) => {
  const sessionSearch = await redisClient.ft.search(
    "userIdx",
    `@userId:{${userId}}`,
    { LIMIT: { from: 0, size: 0 } },
  );

  if (sessionSearch) return sessionSearch.total > 0;
};

// remove the oldest entry having value = 'userId'
export const removeOldestUserSession = async (userId) => {
  let lowestTTL = Infinity;
  let oldestKey = null;

  const sessionSearch = await redisClient.ft.search(
    "userIdx",
    `@userId:{${userId}}`,
  );

  for (const { id } of sessionSearch?.documents ?? []) {
    const ttl = await redisClient.ttl(id);
    if (ttl > 0 && ttl < lowestTTL) {
      lowestTTL = ttl;
      oldestKey = id;
    }
  }

  if (oldestKey) {
    await redisClient.del(oldestKey);
    return true;
  }

  return false;
};

// remove entry which has 'sessionId'
export const removeUserSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  return await redisClient.del(key);
};

// remove all entries which has prefix as 'userId'
export const destroyAllSessionsOfUser = async (userId) => {
  let isDeleted = false;

  const sessionSearch = await redisClient.ft.search(
    "userIdx",
    `@userId:{${userId}}`,
  );

  for (const { id } of sessionSearch?.documents ?? []) {
    await redisClient.del(id);
    isDeleted = true;
  }

  return isDeleted;
};

// count all entries which has prefix as 'userId'
export const countUserSessions = async (userId) => {
  const sessionSearch = await redisClient.ft.search(
    "userIdx",
    `@userId:{${userId}}`,
    { LIMIT: { from: 0, size: 0 } },
  );

  if (sessionSearch) return sessionSearch.total;
};

/*
1. counter to track no of sessions, but difficult to track which belongs to which particular instance of the user
2. key = userId:sessionId, multiple entries, userId at prefix will make it long but helpful to track individual sessions and expiry
3. key = userId, value = [sessionId], simple, just append new sessions, but difficult to track which one to expire when
4. key = {userId:userId}
*/
