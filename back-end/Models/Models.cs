namespace ComWebApp.Models;

public record User(string Id, string Username, string Email, string PasswordHash);

/* I could have had these in different files, but I wanted to keep it simple for this example. 
In a real application, I would likely want to organize these into 
separate files and folders for better maintainability.*/
public record Message(
    string Id,
    string SenderId,
    string RecipientId,
    string Content,
    DateTime SentAt
);
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

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string UserId, string Username, string Email);
public record UserDto(string Id, string Username);
