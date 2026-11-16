const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error("JWT_SECRET must be set in the environment.");
}

module.exports = { secret };
