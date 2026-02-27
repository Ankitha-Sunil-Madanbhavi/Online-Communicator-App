using ComWebApp.Models;

namespace ComWebApp.Interfaces;
public interface IMessageService
{
   
    Message Store(string senderId, string recipientId, string content, string clientMessageId);
    IEnumerable<Message> GetConversation(string userId, string otherId);
    IEnumerable<Message> GetNewMessages(string userId, DateTime since);
}