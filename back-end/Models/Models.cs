namespace ComWebApp.Models;

public record User(string Id, string Username, string Email, string PasswordHash);

// IsDelivered removed — no longer needed now that polling uses a timestamp
public record Message(
    string Id,
    string SenderId,
    string RecipientId,
    string Content,
    DateTime SentAt
);

// --- Auth DTOs ---
public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string UserId, string Username, string Email);

// --- User DTOs ---
public record UserDto(string Id, string Username);

// --- Message DTOs ---
public record SendMessageRequest(
    string SenderId,
    string RecipientId,
    string Content,
    string ClientMessageId
);

public record MessageDto(
    string Id,
    string SenderId,
    string SenderUsername,
    string RecipientId,
    string Content,
    DateTime SentAt
);
