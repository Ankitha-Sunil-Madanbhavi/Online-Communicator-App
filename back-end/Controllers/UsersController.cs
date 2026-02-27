using ComWebApp.Interfaces;
using ComWebApp.Models;
using Microsoft.AspNetCore.Mvc;

namespace ComWebApp.Controllers;

[ApiController]
[Route("users")]
public class UsersController(IUserService userService) : ControllerBase
{
    
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

    
    [HttpPost("login")]
    public IActionResult Login(LoginRequest request)
    {
        var user = userService.Login(request.Email.Trim(), request.Password);
        if (user is null)
            return Unauthorized(new { error = "Invalid email or password. Not registered yet? Register to start using." });

        return Ok(new AuthResponse(user.Id, user.Username, user.Email));
    }

    
    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();

    
    [HttpGet]
    public IActionResult GetAll() => Ok(userService.GetAll());
}