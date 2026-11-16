# Daymark — Task Management Application

A modern, full-stack task management platform built with React, Node.js, Express, GraphQL (Apollo Server), MongoDB, Redis, and Elasticsearch.

---

## Architecture Overview

```
                      ┌───────────────────────────────┐
                      │    Frontend (React + Vite)    │
                      └──────────────┬────────────────┘
                                     │ HTTP (JWT Bearer)
                                     ▼
                      ┌───────────────────────────────┐
                      │    Express 5 Server (Node)    │
                      │  ├── /api/auth   (REST)       │
                      │  ├── /api/tasks  (REST)       │
                      │  ├── /graphql    (Apollo 5)   │
                      │  └── Rate Limiter (Redis)     │
                      └───────┬───────┬───────┬───────┘
                              │       │       │
              ┌───────────────┘       │       └───────────────┐
              ▼                       ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
    │  MongoDB Mongoose │   │    Redis Cache    │   │   Elasticsearch   │
    │  Primary Store    │   │  Query Caching    │   │  Full-Text Search │
    │  (Users & Tasks)  │   │  & Invalidation   │   │  (With DB Fallback│
    └───────────────────┘   └───────────────────┘   └───────────────────┘
```

The application strictly implements **Separation of Concerns**:
- **`models/`**: Mongoose schemas defining MongoDB document structure, compound indexes, and relational ObjectId references.
- **`controllers/`**: Core business logic for authentication (`authController.js`) and task management (`taskController.js`), decoupled from transport layers.
- **`routes/`**: Clean RESTful endpoints (`/api/auth`, `/api/tasks`).
- **`graphql/`**: Type definitions (`typeDefs.js`) and resolvers (`resolvers.js`) providing an Apollo Server 5 GraphQL interface.
- **`middleware/`**: JWT authentication validation and Redis-backed IP rate-limiting.
- **`config/`**: Isolated database, cache, and search client configurations with graceful degradation.
- **`frontend/src/components/`**: Modular, reusable React UI components (`AuthScreen`, `Dashboard`, `TaskEditor`, `TaskRow`).

---

## Features

- **Authentication & Security**: Secure JWT registration and login with `bcryptjs` password hashing and automatic session management via React Context.
- **Task CRUD**: Create, edit, toggle completion, and delete tasks with real-time UI updates.
- **Full-Text Search with Fallback**: Elasticsearch multi-match queries with field boosting (`title^2`, `description`). Automatically degrades to database regex search if Elasticsearch is offline.
- **High-Performance Caching**: Redis-backed cache layer for paginated task queries (600s TTL) with automated cache invalidation upon any task creation, update, or deletion.
- **Rate Limiting**: Built-in Redis sliding-window IP rate limiter protecting API endpoints against abuse.
- **Pagination & Filters**: Server-side pagination (`page`, `limit`) with completion filters (`All`, `To do`, `Completed`).
- **Responsive Design**: Minimalist, accessible editorial UI supporting both desktop and mobile viewports.

---

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 6
- **State Management**: React Context API (`AuthContext`), custom hooks
- **Styling**: Modern CSS variables, typography, and responsive media queries

### Backend
- **Runtime**: Node.js (>= 20)
- **Framework**: Express 5
- **GraphQL Engine**: Apollo Server 5 (`@apollo/server`, `@as-integrations/express5`)
- **Database**: MongoDB via Mongoose 8/9
- **Cache**: Redis 6 client (`redis`)
- **Search Engine**: Elasticsearch Client (`@elastic/elasticsearch`)
- **Security**: `jsonwebtoken`, `bcryptjs`
- **Testing**: Node.js native test runner (`node:test`, `node:assert/strict`)

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB (local or MongoDB Atlas connection string)
- (Optional) Docker for running Redis and Elasticsearch locally

---

### Step 1: Starting Redis and Elasticsearch (Docker)

You can launch Redis and Elasticsearch with a single command using Docker:

#### 1. Start Redis
```bash
docker run -d --name task-redis -p 6379:6379 redis:alpine
```

#### 2. Start Elasticsearch
```bash
docker run -d --name task-elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

> **Note on Resiliency**: Redis and Elasticsearch are optional for local development. If either service is offline, the backend automatically logs a warning and falls back to MongoDB directly without crashing.

---

### Step 2: Backend Setup

1. Open your terminal in the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/task-management
   JWT_SECRET=your_secure_jwt_secret_here
   REDIS_URL=redis://127.0.0.1:6379
   ELASTICSEARCH_URL=http://127.0.0.1:9200
   ELASTICSEARCH_INDEX=tasks
   ```

5. Run automated tests:
   ```bash
   npm test
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5000`.

---

### Step 3: Frontend Setup

1. Open a new terminal in the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file if connecting to a custom backend host:
   ```bash
   cp .env.example .env
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. Build for production:
   ```bash
   npm run build
   ```

---

## API Reference

### 1. GraphQL API (`/graphql`)

#### Queries
- `getTasks(filter: TaskFilterInput, sortBy: TaskSortField, sortOrder: SortOrder, page: Int, limit: Int): [Task!]!`
- `searchTasks(keyword: String!): [Task!]!`

#### Mutations
- `register(name: String!, email: String!, password: String!): AuthPayload!`
- `login(email: String!, password: String!): AuthPayload!`
- `createTask(title: String!, description: String): Task!`
- `updateTask(id: ID!, title: String, description: String, completed: Boolean): Task!`
- `deleteTask(id: ID!): String!`

---

### 2. REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Sign in with email and password | No |
| `GET` | `/api/tasks` | List tasks (query params: `page`, `limit`, `completed`, `sortBy`) | Yes |
| `GET` | `/api/tasks/search` | Search tasks by keyword (`?keyword=...`) | Yes |
| `POST` | `/api/tasks` | Create new task (`{ title, description }`) | Yes |
| `PUT` | `/api/tasks/:id` | Update task (`{ title, description, completed }`) | Yes |
| `DELETE` | `/api/tasks/:id` | Delete task by ID | Yes |
| `GET` | `/health` | Health check endpoint | No |

---

## Architectural & Technical Decisions

1. **Dual GraphQL + REST Architecture via Shared Controllers**:
   - The frontend leverages GraphQL via Apollo Server for fine-grained field selection and reduced over-fetching.
   - Core domain logic lives inside `controllers/` so that both GraphQL resolvers and Express REST routes share identical validation, caching, and database logic without code duplication.

2. **Redis Cache-Aside Pattern with Atomic Invalidation**:
   - Paginated queries (`getTasks`) are cached under unique compound keys (`tasks:${userId}:${params}`) with a 600-second (10-minute) TTL.
   - Any mutation affecting a user's task state (`createTask`, `updateTask`, `deleteTask`) automatically purges all cached keys matching `tasks:${userId}:*` using non-blocking Redis SCAN iterations, preventing stale reads.

3. **Elasticsearch Indexing with Resilient Database Fallback**:
   - Tasks are indexed in Elasticsearch with title boosted 2x (`title^2`) over descriptions for relevance ranking.
   - If Elasticsearch is offline or unreachable, task operations never fail: writes succeed in MongoDB, and queries fall back to MongoDB case-insensitive regex queries seamlessly.

4. **Stateless JWT Authentication**:
   - Scalable, stateless session management using signed JSON Web Tokens (`7d` expiration).
   - Validated on every authenticated request via Express middleware and injected into Apollo Server `context`.

---

## License

ISC
