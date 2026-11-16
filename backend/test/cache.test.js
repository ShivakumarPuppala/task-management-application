const assert = require("node:assert/strict");
const test = require("node:test");
const { clearUserTaskCache } = require("../graphql/cache");

test("task cache invalidation ignores empty Redis scan batches", async () => {
    let deleteCalls = 0;
    const redisClient = {
        isOpen: true,
        async *scanIterator() {
            yield [];
        },
        async del() {
            deleteCalls += 1;
        }
    };

    await clearUserTaskCache(redisClient, "user-123");

    assert.equal(deleteCalls, 0);
});

test("task cache invalidation handles standard Redis scanIterator string keys", async () => {
    let deletedKeys;
    const redisClient = {
        isOpen: true,
        async *scanIterator() {
            yield "tasks:user-123:page-1";
            yield "tasks:user-123:page-2";
        },
        async del(...keys) {
            deletedKeys = keys;
        }
    };

    await clearUserTaskCache(redisClient, "user-123");

    assert.deepEqual(deletedKeys, [
        "tasks:user-123:page-1",
        "tasks:user-123:page-2"
    ]);
});

test("task cache invalidation flattens Redis scan batches before deleting", async () => {
    let deletedKeys;
    const redisClient = {
        isOpen: true,
        async *scanIterator() {
            yield ["tasks:user-123:first", "tasks:user-123:second"];
            yield [];
            yield ["tasks:user-123:third"];
        },
        async del(...keys) {
            deletedKeys = keys;
        }
    };

    await clearUserTaskCache(redisClient, "user-123");

    assert.deepEqual(deletedKeys, [
        "tasks:user-123:first",
        "tasks:user-123:second",
        "tasks:user-123:third"
    ]);
});
