using System.Collections.Concurrent;
using ComWebApp.Models;

namespace ComWebApp.Services;

public interface IMessageService
{
    /// <summary>Store a message. Idempotent — safe to retry with the same clientMessageId.</summary>
    Message Store(string senderId, string recipientId, string content, string clientMessageId);

    /// <summary>All messages in a conversation between two users, ordered by time.</summary>
    IEnumerable<Message> GetConversation(string userId, string otherId);

    /// <summary>
    /// All messages sent TO userId after the given UTC timestamp.
    /// The client passes its last-synced time; only new messages are returned.
    /// Nothing is deleted or marked — calling this twice returns the same results.
    /// </summary>
    IEnumerable<Message> GetNewMessages(string userId, DateTime since);
}

/// <summary>
/// In-memory message store.
///
/// Previous design used DrainInbox which marked messages as delivered and
/// never returned them again. This caused messages to disappear for users
/// who weren't actively polling (e.g. logged out, then back in).
///
/// New design: messages are never mutated after storage. The client tracks
/// its own lastSyncedAt timestamp and asks "give me everything after this".
/// This is stateless on the server and correct regardless of login state.
/// </summary>
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
