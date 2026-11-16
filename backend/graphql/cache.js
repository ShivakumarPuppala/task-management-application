const clearUserTaskCache = async (redisClient, userId) => {
    if (!redisClient || !redisClient.isOpen) {
        return;
    }

    try {
        const keys = [];
        for await (const item of redisClient.scanIterator({
            MATCH: `tasks:${userId}:*`,
            COUNT: 100
        })) {
            if (Array.isArray(item)) {
                keys.push(...item);
            } else if (typeof item === "string" && item.length > 0) {
                keys.push(item);
            }
        }
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } catch (error) {
        console.warn("Failed to clear user task cache:", error.message);
    }
};

module.exports = { clearUserTaskCache };
