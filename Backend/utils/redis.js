import { randomUUID } from "node:crypto";
import { createClient } from "redis";

export const redisClient = await createClient().connect();

// check if there are sessions exists for that user
// if yes then increment session count, else create and add count=1
export const createUserSession = async (userId, ttl) => {
  const sessionId = randomUUID();
  const result = await redisClient.set(`${userId}:${sessionId}`, userId, {
    expiration: { type: "EX", value: ttl ?? 3600 },
  });

  return sessionId;
};

// find entries which have postfix as 'sessionId'
export const getUserSession = async (sessionId) => {
  // start from index=0
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `*:${sessionId}`,
      COUNT: 1,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // return the session on finding
    if (result.keys.length) return await redisClient.get(result.keys[0]);
  } while (cursor !== "0");

  return null;
};

// check if there is a session exist for the user
// when prefix = userId
export const checkSessionExist = async (userId) => {
  // start from index=0
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${userId}:*`,
      COUNT: 1,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // return true for session exists
    if (result.keys.length) return true;
  } while (cursor !== "0");

  return false;
};

// remove the oldest entry havin prefix as 'userId'
export const removeOldestUserSession = async (userId) => {
  // start from index=0
  let cursor = "0";
  let lowestTTL = Infinity;
  let oldestKey = null;

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${userId}:*`,
      COUNT: 10,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // find the oldest session
    for (const key of result.keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl > 0 && ttl < lowestTTL) {
        lowestTTL = ttl;
        oldestKey = key;
      }
    }
  } while (cursor !== "0");

  if (oldestKey) {
    await redisClient.del(oldestKey);
    return true;
  }
  return false;
};

// remove entry which has postfix as 'sessionId'
export const removeUserSession = async (sessionId) => {
  // start from index=0
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `*:${sessionId}`,
      COUNT: 1,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // delete the session on finding it
    if (result.keys.length) return await redisClient.del(result.keys[0]);
  } while (cursor !== "0");

  return true;
};

// remove all entries which has prefix as 'userId'
export const destroyAllSessionsOfUser = async (userId) => {
  // start from index=0
  let cursor = "0";
  let isDeleted = false;

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${userId}:*`,
      COUNT: 10,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // delete the all sessions on finding it
    if (result.keys.length) {
      for (const key of result.keys) {
        await redisClient.del(key);
      }
      isDeleted = true;
    }
  } while (cursor !== "0");

  return isDeleted;
};

// count all entries which has prefix as 'userId'
export const countUserSessions = async (userId) => {
  // start from index=0
  let cursor = "0";
  let count = 0;

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${userId}:*`,
      COUNT: 10,
    });

    // move starting to, where it left
    cursor = result.cursor;

    // delete the all sessions on finding it
    if (result.keys.length) count += result.keys.length;
  } while (cursor !== "0");

  return count;
};

/*
1. counter to track no of sessions, but difficult to track which belongs to which particular instance of the user
2. key = userId:sessionId, multiple entries, userId at prefix will make it long but helpful to track individual sessions and expiry
3. key = userId, value = [sessionId], simple, just append new sessions, but difficult to track which one to expire when
*/
