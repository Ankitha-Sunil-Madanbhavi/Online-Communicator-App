const BASE = '/api'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? res.statusText)
  }
  if (res.status === 204) return undefined
  return res.json()
}

export const api = {
  register: (username, email, password) =>
    request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) =>
    request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/users/logout', { method: 'POST' }),

  getUsers: () =>
    request('/users'),

  sendMessage: (senderId, recipientId, content, clientMessageId) =>
    request('/messages', {
      method: 'POST',
      body: JSON.stringify({ senderId, recipientId, content, clientMessageId }),
    }),

  // Returns all messages sent to userId after `since` (ISO string)
  getNewMessages: (userId, since) =>
    request(`/messages/new/${userId}?since=${encodeURIComponent(since)}`),

  getConversation: (userId, otherId) =>
    request(`/messages/conversation/${userId}/${otherId}`),
}
