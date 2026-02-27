using ComWebApp.Interfaces;
using ComWebApp.Models;
using Microsoft.AspNetCore.Mvc;

namespace ComWebApp.Controllers;

[ApiController]
[Route("messages")]
public class MessagesController(IMessageService messageService, IUserService userService) : ControllerBase
{
    /// <summary>Send a message. clientMessageId makes this safe to retry.</summary>
    [HttpPost]
    public IActionResult Send(SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { error = "Content cannot be empty" });

        if (userService.GetById(request.SenderId) is null)
            return NotFound(new { error = "Sender not found" });

        if (userService.GetById(request.RecipientId) is null)
            return NotFound(new { error = "Recipient not found" });

        var message = messageService.Store(
            request.SenderId,
            request.RecipientId,
            request.Content,
            request.ClientMessageId
        );

        return Ok(ToDto(message));
    }

    /// <summary>
    /// Poll for new messages received since a given UTC timestamp.
    /// Pass ?since=2024-01-01T00:00:00Z — defaults to last 24h if omitted.
    /// Returns the same results every time — nothing is consumed or deleted.
    /// </summary>
    [HttpGet("new/{userId}")]
    public IActionResult GetNew(string userId, [FromQuery] DateTime? since)
    {
        if (userService.GetById(userId) is null)
            return NotFound(new { error = "User not found" });

        var from = since ?? DateTime.UtcNow.AddDays(-1);
        return Ok(messageService.GetNewMessages(userId, from).Select(ToDto));
    }

    /// <summary>Full conversation history between two users. Always returns everything.</summary>
    [HttpGet("conversation/{userId}/{otherId}")]
    public IActionResult GetConversation(string userId, string otherId)
    {
        if (userService.GetById(userId) is null)
            return NotFound(new { error = "User not found" });

        if (userService.GetById(otherId) is null)
            return NotFound(new { error = "Other user not found" });

        return Ok(messageService.GetConversation(userId, otherId).Select(ToDto));
    }

    private MessageDto ToDto(Message m) => new(
        m.Id,
        m.SenderId,
        userService.GetById(m.SenderId)?.Username ?? "Unknown",
        m.RecipientId,
        m.Content,
        m.SentAt
    );
}