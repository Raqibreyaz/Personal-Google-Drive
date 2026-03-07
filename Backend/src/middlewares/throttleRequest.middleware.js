const lastRequestTime = {};
const throttleRequest = ({ timeGapInSec = 5, freeRequests = 5 }) => {
  return (req, res, next) => {
    const clientIp = req.ip;
    const currentTime = Date.now();

    if (lastRequestTime[clientIp]) {
      const { lastTime, freeRequests } = lastRequestTime[clientIp];
      const timePassed = currentTime - lastTime;

      // delay for rest of the time remaining
      if (freeRequests <= 0 && timePassed < timeGapInSec * 1000) {
        const delay = timeGapInSec * 1000 - timePassed;

        // update last request execution time time by current time + delay
        lastRequestTime[clientIp].lastTime = currentTime + delay;

        setTimeout(() => {
          next();
        }, delay);
      }
      // allow when time passed
      else {
        lastRequestTime[clientIp] = {
          lastTime: currentTime,
          freeRequests: Math.max(freeRequests - 1, 0),
        };
        next();
      }
    }
    // direct allow for first request
    else {
      lastRequestTime[clientIp] = {
        lastTime: currentTime,
        freeRequests: Math.max(freeRequests - 1, 0),
      };
      next();
    }
  };
};

export default throttleRequest;
