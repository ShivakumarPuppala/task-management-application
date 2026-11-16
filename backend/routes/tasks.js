const express = require("express");
const { getUserFromRequest } = require("../middleware/auth");
const {
    createNewTask,
    fetchTasks,
    modifyTask,
    removeTaskById,
    searchUserTasks
} = require("../controllers/taskController");

const router = express.Router();

const requireAuth = (req, res, next) => {
    const user = getUserFromRequest(req);
    if (!user || !user.userId) {
        return res.status(401).json({ error: "Authentication required" });
    }
    req.userId = user.userId;
    next();
};

router.use(requireAuth);

router.get("/", async (req, res) => {
    try {
        const { completed, sortBy, sortOrder, page, limit } = req.query;
        const filter = completed !== undefined ? { completed: completed === "true" } : undefined;
        const tasks = await fetchTasks({
            userId: req.userId,
            filter,
            sortBy,
            sortOrder,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/search", async (req, res) => {
    try {
        const { keyword } = req.query;
        const tasks = await searchUserTasks({ userId: req.userId, keyword });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { title, description } = req.body;
        const task = await createNewTask({ userId: req.userId, title, description });
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const task = await modifyTask({ userId: req.userId, id, title, description, completed });
        res.json(task);
    } catch (error) {
        const status = error.message === "Task not found" ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const message = await removeTaskById({ userId: req.userId, id });
        res.json({ message });
    } catch (error) {
        const status = error.message === "Task not found" ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

module.exports = router;

