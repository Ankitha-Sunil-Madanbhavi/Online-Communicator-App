using ComWebApp.Models;

namespace ComWebApp.Interfaces;
public interface IUserService
{
    (User? user, string? error) Register(string username, string email, string password);
    User? Login(string email, string password);
    User? GetById(string id);
    IEnumerable<UserDto> GetAll();
}