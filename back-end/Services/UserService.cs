using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using ComWebApp.Models;

namespace ComWebApp.Services;

public interface IUserService
{
    (User? user, string? error) Register(string username, string email, string password);
    User? Login(string email, string password);
    User? GetById(string id);
    IEnumerable<UserDto> GetAll();
}

public class UserService : IUserService
{
    private readonly ConcurrentDictionary<string, User> _usersById = new();
    private readonly ConcurrentDictionary<string, string> _emailToId =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, string> _usernameToId =
        new(StringComparer.OrdinalIgnoreCase);

    public (User? user, string? error) Register(string username, string email, string password)
    {
        if (!IsValidEmail(email))
            return (null, "Invalid email address");

        if (password.Length < 6)
            return (null, "Password must be at least 6 characters");

        if (!_emailToId.TryAdd(email, string.Empty))
            return (null, "Email already registered");

        if (!_usernameToId.TryAdd(username, string.Empty))
        {
            _emailToId.TryRemove(email, out _);
            return (null, "Username already taken");
        }

        var user = new User(
            Id: Guid.NewGuid().ToString(),
            Username: username,
            Email: email,
            PasswordHash: BCrypt.Net.BCrypt.HashPassword(password)
        );

        _usersById[user.Id] = user;
        _emailToId[email] = user.Id;
        _usernameToId[username] = user.Id;

        return (user, null);
    }

    public User? Login(string email, string password)
    {
        if (!_emailToId.TryGetValue(email, out var id)) return null;
        if (!_usersById.TryGetValue(id, out var user)) return null;
        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash) ? user : null;
    }

    public User? GetById(string id) =>
        _usersById.TryGetValue(id, out var user) ? user : null;

    public IEnumerable<UserDto> GetAll() =>
        _usersById.Values
            .Select(u => new UserDto(u.Id, u.Username))
            .OrderBy(u => u.Username);

    private static bool IsValidEmail(string email) =>
        Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
}