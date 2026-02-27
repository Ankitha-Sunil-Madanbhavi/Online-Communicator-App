import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { messageQueue } from '../store/messageQueue'
import { generateId } from '../utils/id'
import '../styles/ChatWindow.css'

function cacheKey(userId, otherId) {
  return `communicator:conv:${userId}:${otherId}`
}
function readCache(userId, otherId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId, otherId)) ?? '[]')
  } catch {
    return []
  }
}
function writeCache(userId, otherId, messages) {
  localStorage.setItem(cacheKey(userId, otherId), JSON.stringify(messages.slice(-200)))
}

export function ChatWindow({ currentUser, contact, incomingMessages }) {
  const [messages, setMessages] = useState(() => readCache(currentUser.id, contact.id))
  const [text, setText] = useState('')
  const [syncing, setSyncing] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    setSyncing(true)
    api
      .getConversation(currentUser.id, contact.id)
      .then((serverMessages) => {
        setMessages(serverMessages)
        writeCache(currentUser.id, contact.id, serverMessages)
      })
      .catch(console.error)
      .finally(() => setSyncing(false))
  }, [currentUser.id, contact.id])

  useEffect(() => {
    if (!incomingMessages.length) return
    const relevant = incomingMessages.filter(
      (m) => m.senderId === contact.id || m.recipientId === contact.id
    )
    if (!relevant.length) return
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id))
      const newOnes = relevant.filter((m) => !existingIds.has(m.id))
      if (!newOnes.length) return prev
      const updated = [...prev, ...newOnes]
      writeCache(currentUser.id, contact.id, updated)
      return updated
    })
  }, [incomingMessages, contact.id, currentUser.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return

    const clientMessageId = generateId()
    setText('')

    const optimistic = {
      id: clientMessageId,
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      recipientId: contact.id,
      content,
      sentAt: new Date().toISOString(),
    }
    setMessages((prev) => {
      const updated = [...prev, optimistic]
      writeCache(currentUser.id, contact.id, updated)
      return updated
    })

    try {
      const confirmed = await api.sendMessage(
        currentUser.id, contact.id, content, clientMessageId
      )
      setMessages((prev) => {
        const updated = prev.map((m) => (m.id === clientMessageId ? confirmed : m))
        writeCache(currentUser.id, contact.id, updated)
        return updated
      })
    } catch {
      messageQueue.enqueue({
        clientMessageId,
        senderId: currentUser.id,
        recipientId: contact.id,
        content,
        createdAt: Date.now(),
      })
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>Chat with <strong>{contact.username}</strong></span>
        {syncing && <span className="chat-syncing">syncing…</span>}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !syncing && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUser.id
          return (
            <div
              key={m.id}
              className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}
            >
              <span className="chat-bubble-content">{m.content}</span>
              <span className="chat-bubble-time">
                {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-row">
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          autoFocus
        />
        <button className="chat-send-btn" type="submit">Send</button>
      </form>
    </div>
  )
}