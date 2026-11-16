const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                return false;
            }
            return Math.min(retries * 100, 1000);
        }
    }
});

redisClient.on("error", (err) => {
    if (process.env.NODE_ENV !== "test") {
        console.warn("Redis Error:", err.message);
    }
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis connected successfully!");
    } catch (error) {
        console.warn("Redis connection failed (caching disabled):", error.message);
    }
};

module.exports = { redisClient, connectRedis };
