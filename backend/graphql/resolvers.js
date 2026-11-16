const {
    loginUser,
    registerUser
} = require("../controllers/authController");
const {
    createNewTask,
    fetchTasks,
    modifyTask,
    removeTaskById,
    searchUserTasks
} = require("../controllers/taskController");

const requireUserId = (context) => {
    if (!context.user || !context.user.userId) {
        throw new Error("Authentication required");
    }

    return context.user.userId;
};

const serializeDate = (value) => new Date(value).toISOString();

const resolvers = {
    User: {
        id: (user) => user._id.toString()
    },

    Task: {
        id: (task) => task._id.toString(),
        userId: (task) => task.userId.toString(),
        createdAt: (task) => serializeDate(task.createdAt),
        updatedAt: (task) => serializeDate(task.updatedAt)
    },

    Query: {
        getTasks: async (_, args, context) => {
            const userId = requireUserId(context);
            return fetchTasks({ userId, ...args });
        },

        searchTasks: async (_, { keyword }, context) => {
            const userId = requireUserId(context);
            return searchUserTasks({ userId, keyword });
        }
    },

    Mutation: {
        register: async (_, { name, email, password }) => {
            return registerUser({ name, email, password });
        },

        login: async (_, { email, password }) => {
            return loginUser({ email, password });
        },

        createTask: async (_, { title, description }, context) => {
            const userId = requireUserId(context);
            return createNewTask({ userId, title, description });
        },

        updateTask: async (_, { id, title, description, completed }, context) => {
            const userId = requireUserId(context);
            return modifyTask({ userId, id, title, description, completed });
        },

        deleteTask: async (_, { id }, context) => {
            const userId = requireUserId(context);
            return removeTaskById({ userId, id });
        }
    }
};

module.exports = resolvers;
