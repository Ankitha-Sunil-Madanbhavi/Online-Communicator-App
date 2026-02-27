import { useEffect, useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useMessageSync } from '../hooks/useMessageSync'
import { ChatWindow } from './ChatWindow'
import '../styles/App.css'

function getLastContactId(userId) {
  return localStorage.getItem(`communicator:lastContact:${userId}`) ?? null
}
function saveLastContactId(userId, contactId) {
  localStorage.setItem(`communicator:lastContact:${userId}`, contactId)
}

export function App() {
  const { currentUser, users, logout } = useCurrentUser()
  const [selected, setSelected] = useState(null)
  const [incoming, setIncoming] = useState([])
  const [unread, setUnread] = useState({})

  useEffect(() => {
    setSelected(null)
    setIncoming([])
    setUnread({})
  }, [currentUser?.id])

  useEffect(() => {
    if (!users.length || !currentUser) return
    const lastId = getLastContactId(currentUser.id)
    if (!lastId) return
    const contact = users.find((u) => u.id === lastId)
    if (contact) setSelected(contact)
  }, [users, currentUser?.id])

  const { isOnline } = useMessageSync(currentUser?.id, (msgs) => {
    setIncoming((prev) => [...prev, ...msgs])
    setUnread((prev) => {
      const next = { ...prev }
      for (const m of msgs) {
        if (m.senderId !== currentUser?.id && m.senderId !== selected?.id) {
          next[m.senderId] = (next[m.senderId] ?? 0) + 1
        }
      }
      return next
    })
  })

  function selectUser(user) {
    setSelected(user)
    setUnread((prev) => ({ ...prev, [user.id]: 0 }))
    saveLastContactId(currentUser.id, user.id)
  }

  const contacts = users.filter((u) => u.id !== currentUser?.id)

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user-info">
            <div className="sidebar-username">{currentUser?.username}</div>
            <div className="sidebar-email">{currentUser?.email}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>Logout</button>
        </div>

        {!isOnline && (
          <div className="sidebar-offline-banner">⚠ Offline — messages queued</div>
        )}

        <p className="sidebar-label">USERS</p>
        {contacts.length === 0 && (
          <p className="sidebar-hint">No other users yet.</p>
        )}
        {contacts.map((u) => (
          <button
            key={u.id}
            className={`sidebar-user-btn${selected?.id === u.id ? ' active' : ''}`}
            onClick={() => selectUser(u)}
          >
            {u.username}
            {(unread[u.id] ?? 0) > 0 && (
              <span className="sidebar-badge">{unread[u.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="app-main">
        {selected ? (
          <ChatWindow
            key={`${currentUser.id}__${selected.id}`}
            currentUser={currentUser}
            contact={selected}
            incomingMessages={incoming}
          />
        ) : (
          <p className="app-placeholder">← Select a user to start chatting</p>
        )}
      </div>
    </div>
  )
}