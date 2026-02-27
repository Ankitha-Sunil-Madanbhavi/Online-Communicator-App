# Communicator

A full-stack real-time messaging app built with React (frontend) and ASP.NET Core (backend).

## Features

- Register and login with email and password
- See all registered users and message any of them
- Real-time chat with 3-second polling for new messages
- Offline support — messages are queued locally and auto-delivered when connection restores
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

## Note
This app uses in-memory storage — all data is lost when the backend restarts.
A database integration (SQLite or PostgreSQL) would be needed for production use.
