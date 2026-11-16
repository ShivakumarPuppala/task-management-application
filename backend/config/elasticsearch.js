const fs = require("node:fs");
const { Client } = require("@elastic/elasticsearch");

const index = process.env.ELASTICSEARCH_INDEX || "tasks";
const clientOptions = {
    node: process.env.ELASTICSEARCH_URL || "http://127.0.0.1:9200",
    maxRetries: 1,
    requestTimeout: 2500
};
const username = process.env.ELASTICSEARCH_USERNAME;
const password = process.env.ELASTICSEARCH_PASSWORD;

if (Boolean(username) !== Boolean(password)) {
    throw new Error("ELASTICSEARCH_USERNAME and ELASTICSEARCH_PASSWORD must be set together.");
}

if (username) {
    clientOptions.auth = { username, password };
}

if (process.env.ELASTICSEARCH_CA_CERT) {
    clientOptions.tls = {
        ca: fs.readFileSync(process.env.ELASTICSEARCH_CA_CERT)
    };
}

const client = new Client(clientOptions);

let indexReady;

const ensureIndex = async () => {
    if (!indexReady) {
        indexReady = (async () => {
            const exists = await client.indices.exists({ index });
            if (!exists) {
                await client.indices.create({
                    index,
                    mappings: {
                        properties: {
                            userId: { type: "keyword" },
                            title: { type: "text" },
                            description: { type: "text" },
                            completed: { type: "boolean" },
                            createdAt: { type: "date" },
                            updatedAt: { type: "date" }
                        }
                    }
                });
            }
        })();
    }

    try {
        await indexReady;
    } catch (error) {
        indexReady = undefined;
        throw error;
    }
};

const syncTask = async (task) => {
    try {
        await ensureIndex();
        await client.index({
            index,
            id: task._id.toString(),
            document: {
                userId: task.userId.toString(),
                title: task.title,
                description: task.description || "",
                completed: task.completed,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            },
            refresh: "wait_for"
        });
    } catch (error) {
        console.warn("Elasticsearch sync skipped (ES unavailable):", error.message);
    }
};

const removeTask = async (taskId) => {
    try {
        await ensureIndex();
        await client.delete({
            index,
            id: taskId.toString(),
            refresh: "wait_for"
        });
    } catch (error) {
        if (error.meta && error.meta.statusCode === 404) {
            return;
        }
        console.warn("Elasticsearch remove skipped (ES unavailable):", error.message);
    }
};

const searchTasks = async (userId, keyword) => {
    await ensureIndex();
    const response = await client.search({
        index,
        size: 100,
        query: {
            bool: {
                filter: [{ term: { userId: userId.toString() } }],
                must: [{
                    multi_match: {
                        query: keyword,
                        fields: ["title^2", "description"]
                    }
                }]
            }
        }
    });

    return response.hits.hits.map((hit) => hit._id);
};

module.exports = { removeTask, searchTasks, syncTask };

