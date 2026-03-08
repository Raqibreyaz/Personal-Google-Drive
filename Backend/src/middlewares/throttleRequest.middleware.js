import redisClient from "../config/redis.js";

const throttleRequest = ({
  throttleKeyGenerator,
  timeGapInSec = 5,
  freeRequests = 5,
}) => {
  return async (req, res, next) => {
    const throttleKey = throttleKeyGenerator(req);
    const currentTime = Date.now();

    try {
      const data = await redisClient.hGetAll(throttleKey);
      const doesExist = Object.keys(data).length > 0;

      const initialFreeRequests = doesExist
        ? parseInt(data.freeRequests)
        : freeRequests;
      const lastTime = doesExist ? parseInt(data.lastTime) : currentTime;
      const timePassed = currentTime - lastTime;

      // when user has not requested before
      // or free requests are available
      // or last request execution time has passed the time gap
      // + when time gap passed then assign free requests
      if (
        !doesExist ||
        initialFreeRequests > 0 ||
        timePassed >= timeGapInSec * 1000
      ) {
        // expire it in 10mins
        await redisClient
          .multi()
          .hSet(throttleKey, {
            lastTime: String(currentTime),
            freeRequests: String(
              timePassed >= timeGapInSec * 1000
                ? Math.max(freeRequests - 1, 0)
                : Math.max(initialFreeRequests - 1, 0),
            ),
          })
          .expire(throttleKey, 10 * 60)
          .exec();

        next();
      } else {
        const delay = timeGapInSec * 1000 - timePassed;

        // update last request execution time by current time + delay
        await redisClient.hSet(
          throttleKey,
          "lastTime",
          String(currentTime + delay),
        );

        setTimeout(() => {
          next();
        }, delay);
      }
    } catch (error) {
      console.log(error);
      next();
    }
  };
};

export default throttleRequest;
