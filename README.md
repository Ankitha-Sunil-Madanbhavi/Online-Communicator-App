# Communicator

A full-stack real-time messaging app built with React (frontend) and ASP.NET Core (backend).

## Features

- Register and login with email and password
- See all registered users and message any of them
- Offline support messages are queued locally and auto-delivered when connection restores
- Conversation history preserved across logout and login
- Passwords hashed with BCrypt

## Tech Stack

**Frontend**
- React (Vite, JavaScript)
- LocalStorage for offline message queue and conversation cache

**Backend**
- ASP.NET Core 8 (.NET)
- In-memory storage (no database)
- BCrypt password hashing
- Swagger UI for API testing

---

## Getting Started

**Backend**
```bash
cd back-end
dotnet restore
dotnet run
```
Runs on `http://localhost:5117`

**Frontend**
```bash
cd front-end
npm install
npm run dev
```
Runs on `http://localhost:5173`

Open `http://localhost:5173` in your browser. Register an account to get started.

---

## File Structure

```
communicator/
│
├── back-end/                          # ASP.NET Core 8 backend
│   ├── Controllers/
│   │   ├── MessagesController.cs      # POST /messages, GET /messages/new, GET /messages/conversation
│   │   └── UsersController.cs         # POST /users/register, POST /users/login, GET /users
│   ├── Interfaces/
│   │   ├── IMessageService.cs         # Contract for message storage and retrieval
│   │   └── IUserService.cs            # Contract for user registration and login
│   ├── Models/
│   │   └── Models.cs                  # All domain records and DTOs (User, Message, AuthResponse, etc.)
│   ├── Services/
│   │   ├── MessageService.cs          # In-memory message store, idempotency via clientMessageId
│   │   └── UserService.cs             # In-memory user store, BCrypt password hashing
│   ├── Program.cs                     # App entry point — DI registration, middleware, CORS
│   └── ComWebApp.csproj               # Project file — NuGet packages (BCrypt, Swagger)
│
└── front-end/                         # React + Vite frontend
    ├── src/
    │   ├── api/
    │   │   └── client.js              # All fetch calls to the backend (login, register, messages)
    │   ├── components/
    │   │   ├── App.jsx                # Main layout — sidebar with user list, chat area
    │   │   ├── App.css                # Styles for App layout and sidebar
    │   │   ├── AuthForm.jsx           # Login / Register form with tab switcher
    │   │   ├── AuthForm.css           # Styles for the auth card, inputs, tabs
    │   │   ├── ChatWindow.jsx         # Conversation view, message bubbles, send form
    │   │   └── ChatWindow.css         # Styles for chat bubbles, input row, header
    │   ├── hooks/
    │   │   ├── useCurrentUser.jsx     # Auth context — login, register, logout, user list
    │   │   └── useMessageSync.js      # 3-second poll for new messages + offline queue flush
    │   ├── store/
    │   │   └── messageQueue.js        # localStorage-backed queue for offline messages
    │   ├── utils/
    │   │   └── id.js                  # crypto.randomUUID() wrapper for clientMessageId
    │   └── main.jsx                   # React root — renders AuthForm or App based on login state
    └── vite.config.js                 # Vite config — proxies /api to the backend port
```

---

## How It Works

**Authentication**
Users register with a username, email, and password. Passwords are hashed with BCrypt before storage. On login the server verifies the hash and returns the user's ID, username, and email. The session is stored in `sessionStorage` so closing the tab logs the user out — opening the app always starts at the sign-in page.

**Messaging**
Messages are sent via `POST /messages` with a `clientMessageId` (a UUID generated on the client). The server uses this ID to deduplicate retries — if the same message is sent twice, the server returns the already-stored message rather than creating a duplicate. Each user polls `GET /messages/new/{userId}?since=<timestamp>` every 3 seconds to pick up messages sent to them. The `since` timestamp is stored in `localStorage` per user so the poll never re-fetches old messages.

**Offline Queue**
If a send fails (e.g. the backend is unreachable), the message is saved to a `localStorage` queue. The sync hook flushes this queue every 3 seconds whenever the backend is reachable. Messages are only removed from the queue after the server confirms receipt, so no message is ever silently dropped.

**Conversation Cache**
Each conversation is cached in `localStorage` under a key scoped to both user IDs. When a user opens a chat, cached messages appear instantly while the fresh data loads from the server in the background.

---

## Further Enhancements

### Database persistence
The biggest limitation right now is that all users and messages live in memory — a backend restart wipes everything. Replacing the `ConcurrentDictionary` stores with **Entity Framework Core + SQLite** (file-based, no separate server) would make data permanent with minimal code change. For a hosted app, **PostgreSQL** on a service like Supabase or Render would be the next step.

### Authentication tokens
Currently `senderId` is trusted from the request body — there is nothing stopping a client from sending as a different user ID. Adding **JWT tokens** would fix this: login returns a signed token, every request includes it in the `Authorization` header, and the server verifies the token before processing the request.

### Message status indicators
Adding sent / delivered / read receipts so the sender knows whether their message has been seen. This would require tracking delivery state per user per message in the backend.

### Rate limiting
The login endpoint has no brute-force protection. Adding **rate limiting middleware** (e.g. `AspNetCoreRateLimit`) would lock an account after a number of failed attempts within a time window.

### File and image sharing
Extending the message model to support attachments — images, documents — stored in a blob storage service like AWS S3 or Cloudflare R2.

### Push notifications
When the app is in the background or closed, users get no indication of new messages. Integrating **Web Push notifications** via the Push API would allow the browser to notify the user even when the tab is closed.


---

## Note

This app uses in-memory storage — all data is lost when the backend restarts. A database integration (SQLite or PostgreSQL) would be needed for production use.
