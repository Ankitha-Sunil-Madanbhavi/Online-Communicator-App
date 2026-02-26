const KEY = 'communicator:pending'

/**
 * localStorage-backed queue for messages that failed to send.
 * Survives page refresh — messages are retried once the user is back online.
 */
export const messageQueue = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      return []
    }
  },

  enqueue(msg) {
    const current = messageQueue.load()
    localStorage.setItem(KEY, JSON.stringify([...current, msg]))
  },

  remove(clientMessageId) {
    const current = messageQueue.load()
    localStorage.setItem(
      KEY,
      JSON.stringify(current.filter((m) => m.clientMessageId !== clientMessageId))
    )
  },
}
