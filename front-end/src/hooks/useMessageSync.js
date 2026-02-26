import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { messageQueue } from '../store/messageQueue'

const POLL_INTERVAL_MS = 3000
// localStorage key for persisting the last-synced timestamp per user
const syncKey = (userId) => `communicator:lastSync:${userId}`

export function useMessageSync(currentUserId, onNewMessages) {
  const callbackRef = useRef(onNewMessages)
  callbackRef.current = onNewMessages

  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const flushQueue = useCallback(async () => {
    if (!currentUserId || !isOnline) return
    for (const msg of messageQueue.load()) {
      try {
        await api.sendMessage(msg.senderId, msg.recipientId, msg.content, msg.clientMessageId)
        messageQueue.remove(msg.clientMessageId)
      } catch {
        break
      }
    }
  }, [currentUserId, isOnline])

  const pollNewMessages = useCallback(async () => {
    if (!currentUserId || !isOnline) return
    try {
      // Read the last time we successfully synced for this user.
      // On first poll this will be null, so we use 24h ago as a safe default
      // (the backend also defaults to 24h if since is missing).
      const stored = localStorage.getItem(syncKey(currentUserId))
      const since = stored ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const msgs = await api.getNewMessages(currentUserId, since)

      if (msgs.length > 0) {
        callbackRef.current(msgs)
        // Advance the sync cursor to the newest message we just received
        const latest = msgs.reduce((max, m) =>
          new Date(m.sentAt) > new Date(max.sentAt) ? m : max
        )
        // Add 1ms so we don't re-fetch the last message on next poll
        const nextSince = new Date(new Date(latest.sentAt).getTime() + 1).toISOString()
        localStorage.setItem(syncKey(currentUserId), nextSince)
      }
    } catch {
      // ignore transient errors — will retry next tick
    }
  }, [currentUserId, isOnline])

  useEffect(() => {
    if (!currentUserId) return
    void flushQueue()
    void pollNewMessages()
    const id = setInterval(() => {
      void flushQueue()
      void pollNewMessages()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [currentUserId, flushQueue, pollNewMessages])

  return { isOnline }
}
