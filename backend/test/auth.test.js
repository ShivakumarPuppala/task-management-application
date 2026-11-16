const assert = require("node:assert/strict");
const test = require("node:test");

process.env.JWT_SECRET = "test-secret-for-auth-tests";

const jwt = require("jsonwebtoken");
const resolvers = require("../graphql/resolvers");
const { getUserFromRequest } = require("../middleware/auth");

test("authentication middleware accepts a valid bearer token", () => {
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET);
    const user = getUserFromRequest({
        headers: { authorization: `Bearer ${token}` }
    });

    assert.deepEqual(user, { userId: "user-123" });
});

test("authentication middleware rejects missing and invalid tokens", () => {
    assert.equal(getUserFromRequest({ headers: {} }), null);
    assert.equal(
        getUserFromRequest({ headers: { authorization: "Bearer invalid" } }),
        null
    );
});

test("task queries and mutations reject unauthenticated callers", async () => {
    await assert.rejects(
        resolvers.Query.getTasks(null, {}, { user: null }),
        /Authentication required/
    );

    await assert.rejects(
        resolvers.Query.searchTasks(null, { keyword: "test" }, { user: null }),
        /Authentication required/
    );

    await assert.rejects(
        resolvers.Mutation.createTask(null, { title: "New" }, { user: null }),
        /Authentication required/
    );

    await assert.rejects(
        resolvers.Mutation.updateTask(null, { id: "507f1f77bcf86cd799439011" }, { user: null }),
        /Authentication required/
    );

    await assert.rejects(
        resolvers.Mutation.deleteTask(null, { id: "507f1f77bcf86cd799439011" }, { user: null }),
        /Authentication required/
    );
});

test("task date fields serialize both database dates and cached date strings", () => {
    const date = new Date("2026-11-15T10:00:00.000Z");
    const task = { createdAt: date, updatedAt: date };
    const cachedTask = {
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
    };

    assert.equal(resolvers.Task.createdAt(task), date.toISOString());
    assert.equal(resolvers.Task.updatedAt(task), date.toISOString());
    assert.equal(resolvers.Task.createdAt(cachedTask), date.toISOString());
    assert.equal(resolvers.Task.updatedAt(cachedTask), date.toISOString());
});

test("registration validates required inputs", async () => {
    await assert.rejects(
        resolvers.Mutation.register(null, { name: "", email: "user@example.com", password: "password123" }),
        /Name is required/
    );

    await assert.rejects(
        resolvers.Mutation.register(null, { name: "User", email: "invalid-email", password: "password123" }),
        /A valid email address is required/
    );

    await assert.rejects(
        resolvers.Mutation.register(null, { name: "User", email: "user@example.com", password: "123" }),
        /Password must be at least 6 characters/
    );
});

test("task operations validate inputs", async () => {
    const authContext = { user: { userId: "507f1f77bcf86cd799439011" } };

    await assert.rejects(
        resolvers.Mutation.createTask(null, { title: "   " }, authContext),
        /Task title is required/
    );

    await assert.rejects(
        resolvers.Mutation.updateTask(null, { id: "invalid-id", title: "Valid" }, authContext),
        /Task not found/
    );

    await assert.rejects(
        resolvers.Mutation.deleteTask(null, { id: "invalid-id" }, authContext),
        /Task not found/
    );
});
