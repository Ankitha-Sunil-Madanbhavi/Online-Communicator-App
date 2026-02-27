using System.Collections.Concurrent;
using ComWebApp.Models;
using ComWebApp.Interfaces;

namespace ComWebApp.Services;

public class MessageService : IMessageService
{
    private readonly ConcurrentDictionary<string, Message> _messages = new();
    private readonly ConcurrentDictionary<string, string> _idempotencyKeys = new();

    public Message Store(string senderId, string recipientId, string content, string clientMessageId)
    {
        if (_idempotencyKeys.TryGetValue(clientMessageId, out var existingId) &&
            _messages.TryGetValue(existingId, out var existing))
            return existing;

        var message = new Message(
            Id: Guid.NewGuid().ToString(),
            SenderId: senderId,
            RecipientId: recipientId,
            Content: content,
            SentAt: DateTime.UtcNow
        );

        _messages[message.Id] = message;
        _idempotencyKeys[clientMessageId] = message.Id;
        return message;
    }

    public IEnumerable<Message> GetConversation(string userId, string otherId) =>
        _messages.Values
            .Where(m =>
                (m.SenderId == userId && m.RecipientId == otherId) ||
                (m.SenderId == otherId && m.RecipientId == userId))
            .OrderBy(m => m.SentAt);

    public IEnumerable<Message> GetNewMessages(string userId, DateTime since) =>
        _messages.Values
            .Where(m => m.RecipientId == userId && m.SentAt > since)
            .OrderBy(m => m.SentAt);
}
