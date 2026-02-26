using ComWebApp.Models;
using ComWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComWebApp.Controllers;

[ApiController]
[Route("users")]
public class UsersController(IUserService userService) : ControllerBase
{
    /// <summary>Register a new user with username, email and password.</summary>
    [HttpPost("register")]
    public IActionResult Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { error = "Username is required" });

        var (user, error) = userService.Register(
            request.Username.Trim(),
            request.Email.Trim(),
            request.Password
        );

        if (user is null)
            return Conflict(new { error });

        return Ok(new AuthResponse(user.Id, user.Username, user.Email));
    }

    /// <summary>Login with email and password.</summary>
    [HttpPost("login")]
    public IActionResult Login(LoginRequest request)
    {
        var user = userService.Login(request.Email.Trim(), request.Password);
        if (user is null)
            return Unauthorized(new { error = "Invalid email or password. Not registered yet? Register to start using." });

        return Ok(new AuthResponse(user.Id, user.Username, user.Email));
    }

    /// <summary>Logout.</summary>
    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();

    /// <summary>Get all registered users.</summary>
    [HttpGet]
    public IActionResult GetAll() => Ok(userService.GetAll());
}