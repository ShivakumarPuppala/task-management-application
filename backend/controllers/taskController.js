const mongoose = require("mongoose");
const Task = require("../models/Task");
const { redisClient } = require("../config/redis");
const { clearUserTaskCache } = require("../graphql/cache");
const {
    removeTask: removeTaskFromSearch,
    searchTasks: searchTaskIds,
    syncTask
} = require("../config/elasticsearch");

const fetchTasks = async ({ userId, filter, sortBy, sortOrder, page, limit }) => {
    const query = { userId };

    if (filter && filter.completed !== undefined) {
        query.completed = filter.completed;
    }

    const sortFieldMap = {
        CREATED_AT: "createdAt",
        UPDATED_AT: "updatedAt",
        TITLE: "title"
    };

    const sortField = sortFieldMap[sortBy] || "createdAt";
    const sortDirection = sortOrder === "ASC" ? 1 : -1;

    const currentPage = Math.max(1, page || 1);
    const pageSize = Math.min(100, Math.max(1, limit || 10));

    const cacheKey = `tasks:${userId}:${JSON.stringify({
        filter,
        sortBy,
        sortOrder,
        currentPage,
        pageSize
    })}`;

    if (redisClient && redisClient.isOpen) {
        try {
            const cachedTasks = await redisClient.get(cacheKey);
            if (cachedTasks) {
                return JSON.parse(cachedTasks);
            }
        } catch (error) {
            console.warn("Failed to read tasks from Redis cache:", error.message);
        }
    }

    const tasks = await Task.find(query)
        .sort({ [sortField]: sortDirection })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean();

    if (redisClient && redisClient.isOpen) {
        try {
            await redisClient.setEx(cacheKey, 600, JSON.stringify(tasks));
        } catch (error) {
            console.warn("Failed to write tasks to Redis cache:", error.message);
        }
    }

    return tasks;
};

const searchUserTasks = async ({ userId, keyword }) => {
    const normalizedKeyword = keyword ? keyword.trim() : "";
    if (!normalizedKeyword) {
        return [];
    }

    try {
        const taskIds = await searchTaskIds(userId, normalizedKeyword);
        if (taskIds && taskIds.length > 0) {
            const tasks = await Task.find({ _id: { $in: taskIds }, userId }).lean();
            const tasksById = new Map(tasks.map((task) => [task._id.toString(), task]));
            return taskIds.map((id) => tasksById.get(id)).filter(Boolean);
        }
        if (taskIds && taskIds.length === 0) {
            return [];
        }
    } catch (error) {
        console.warn("Elasticsearch search failed, falling back to database query:", error.message);
    }

    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return Task.find({
        userId,
        $or: [{ title: regex }, { description: regex }]
    })
        .sort({ createdAt: -1 })
        .lean();
};

const createNewTask = async ({ userId, title, description }) => {
    const trimmedTitle = (title || "").trim();
    if (!trimmedTitle) {
        throw new Error("Task title is required");
    }

    const task = await Task.create({
        title: trimmedTitle,
        description: description ? description.trim() : "",
        userId
    });

    await syncTask(task);
    await clearUserTaskCache(redisClient, userId);

    return task;
};

const modifyTask = async ({ userId, id, title, description, completed }) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Task not found");
    }

    const updates = {};
    if (title !== undefined) {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            throw new Error("Task title cannot be empty");
        }
        updates.title = trimmedTitle;
    }
    if (description !== undefined) {
        updates.description = description.trim();
    }
    if (completed !== undefined) {
        updates.completed = completed;
    }

    const task = await Task.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true, runValidators: true }
    );

    if (!task) {
        throw new Error("Task not found");
    }

    await syncTask(task);
    await clearUserTaskCache(redisClient, userId);

    return task;
};

const removeTaskById = async ({ userId, id }) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Task not found");
    }

    const task = await Task.findOneAndDelete({
        _id: id,
        userId
    });

    if (!task) {
        throw new Error("Task not found");
    }

    await removeTaskFromSearch(id);
    await clearUserTaskCache(redisClient, userId);

    return "Task deleted successfully";
};

module.exports = {
    createNewTask,
    fetchTasks,
    modifyTask,
    removeTaskById,
    searchUserTasks
};

