const { parse } = require("graphql");

const typeDefs = parse(`
    type User {
        id: ID!
        name: String!
        email: String!
    }

    type Task {
        id: ID!
        title: String!
        description: String
        completed: Boolean!
        userId: ID!
        createdAt: String!
        updatedAt: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    input TaskFilterInput {
        completed: Boolean
    }

    enum TaskSortField {
        CREATED_AT
        UPDATED_AT
        TITLE
    }

    enum SortOrder {
        ASC
        DESC
    }

    type Query {
        getTasks(
            filter: TaskFilterInput
            sortBy: TaskSortField
            sortOrder: SortOrder
            page: Int
            limit: Int
        ): [Task!]!

        searchTasks(keyword: String!): [Task!]!
    }

    type Mutation {
        register(
            name: String!
            email: String!
            password: String!
        ): AuthPayload!

        login(
            email: String!
            password: String!
        ): AuthPayload!

        createTask(
            title: String!
            description: String
        ): Task!

        updateTask(
            id: ID!
            title: String
            description: String
            completed: Boolean
        ): Task!

        deleteTask(id: ID!): String!
    }
`);

module.exports = typeDefs;
