const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { secret: JWT_SECRET } = require("../config/jwt");

const registerUser = async ({ name, email, password }) => {
    const trimmedName = (name || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!trimmedName) {
        throw new Error("Name is required");
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error("A valid email address is required");
    }
    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword
    });

    const token = jwt.sign(
        { userId: user._id.toString() },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { token, user };
};

const loginUser = async ({ email, password }) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail || !password) {
        throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
        { userId: user._id.toString() },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { token, user };
};

module.exports = { loginUser, registerUser };

