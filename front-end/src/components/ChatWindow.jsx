import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { messageQueue } from '../store/messageQueue'
import { generateId } from '../utils/id'

// Cache key includes BOTH user IDs in a fixed order (sender:recipient) so
// ankitha-bob and newuser-bob are always separate cache entries.
// We don't sort — ankitha's view of the chat and bob's view are stored separately,
// which is correct since each side sees the same messages but from their own userId.
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
  // Load from cache first so messages appear instantly before API responds
  const [messages, setMessages] = useState(() => readCache(currentUser.id, contact.id))
  const [text, setText] = useState('')
  const [syncing, setSyncing] = useState(true)
  const bottomRef = useRef(null)

  // Fetch the full conversation from the server.
  // This is the source of truth — overwrites the cache with fresh data.
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

  // Merge messages arriving via the poll, dedup by ID
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

    // Optimistic update — show immediately before server confirms
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
      // Replace optimistic entry with server-confirmed message
      setMessages((prev) => {
        const updated = prev.map((m) => (m.id === clientMessageId ? confirmed : m))
        writeCache(currentUser.id, contact.id, updated)
        return updated
      })
    } catch {
      // Offline — queue for retry
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
    <div style={s.container}>
      <div style={s.header}>
        <span>Chat with <strong>{contact.username}</strong></span>
        {syncing && <span style={s.syncing}>syncing…</span>}
      </div>
      <div style={s.messages}>
        {messages.length === 0 && !syncing && (
          <p style={s.empty}>No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUser.id
          return (
            <div key={m.id} style={{ ...s.bubble, ...(mine ? s.mine : s.theirs) }}>
              <span style={s.content}>{m.content}</span>
              <span style={s.time}>
                {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={s.inputRow}>
        <input
          style={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          autoFocus
        />
        <button style={s.sendBtn} type="submit">Send</button>
      </form>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #ddd', background: '#f9f9f9' },
  syncing: { fontSize: 11, color: '#aaa' },
  messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  bubble: { maxWidth: '70%', padding: '8px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 2 },
  mine: { alignSelf: 'flex-end', background: '#0070f3', color: '#fff' },
  theirs: { alignSelf: 'flex-start', background: '#eee', color: '#000' },
  content: { fontSize: 14 },
  time: { fontSize: 10, opacity: 0.7, alignSelf: 'flex-end' },
  inputRow: { display: 'flex', gap: 8, padding: '10px 16px', borderTop: '1px solid #ddd' },
  input: { flex: 1, padding: '8px 10px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  sendBtn: { padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  empty: { color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 },
}
