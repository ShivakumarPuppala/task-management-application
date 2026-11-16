require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const connectDB = require("./config/db");
const { redisClient, connectRedis } = require("./config/redis");
const resolvers = require("./graphql/resolvers");
const typeDefs = require("./graphql/typeDefs");
const { getUserFromRequest } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();

const rateLimiter = async (req, res, next) => {
    if (!redisClient.isOpen) {
        return next();
    }
    const ip = req.ip || req.socket?.remoteAddress || "127.0.0.1";
    const key = `ratelimit:${ip}`;
    try {
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, 60);
        }
        if (count > 120) {
            return res.status(429).json({
                error: "Too many requests. Please try again in a minute."
            });
        }
    } catch (err) {
        console.warn("Rate limit check failed:", err.message);
    }
    next();
};

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Health check and root endpoints
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
    res.send("Task Management API is running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await connectRedis();

    const apolloServer = new ApolloServer({ typeDefs, resolvers });
    await apolloServer.start();

    app.use(
        "/graphql",
        expressMiddleware(apolloServer, {
            context: async ({ req }) => ({ user: getUserFromRequest(req) })
        })
    );

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exitCode = 1;
});
