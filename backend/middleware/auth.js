
const jwt = require("jsonwebtoken");
const { secret: JWT_SECRET } = require("../config/jwt");

const getUserFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    let decoded;
    try {
        decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return null;
        }
        throw error;
    }

    if (typeof decoded !== "object" || !decoded.userId) {
        return null;
    }

    return { userId: decoded.userId };
};

module.exports = { getUserFromRequest };
