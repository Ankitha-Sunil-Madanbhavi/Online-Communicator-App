import { useEffect, useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useMessageSync } from '../hooks/useMessageSync'
import { ChatWindow } from './ChatWindow'

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

  // Hard reset all per-session state when the logged-in user changes
  useEffect(() => {
    setSelected(null)
    setIncoming([])
    setUnread({})
  }, [currentUser?.id])

  // Restore last open contact once the user list is available
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
    <div style={s.shell}>
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          {/* minWidth:0 lets the text block shrink and truncate instead of
              pushing the logout button out of the sidebar */}
          <div style={s.userInfo}>
            <div style={s.username}>{currentUser?.username}</div>
            <div style={s.email}>{currentUser?.email}</div>
          </div>
          {/* flexShrink:0 ensures the button is never squashed */}
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>

        {!isOnline && <div style={s.offline}>⚠ Offline — messages queued</div>}

        <p style={s.label}>USERS</p>
        {contacts.length === 0 && <p style={s.hint}>No other users yet.</p>}
        {contacts.map((u) => (
          <button
            key={u.id}
            style={{ ...s.userBtn, ...(selected?.id === u.id ? s.active : {}) }}
            onClick={() => selectUser(u)}
          >
            {u.username}
            {(unread[u.id] ?? 0) > 0 && <span style={s.badge}>{unread[u.id]}</span>}
          </button>
        ))}
      </div>

      <div style={s.main}>
        {selected ? (
          <ChatWindow
            key={`${currentUser.id}__${selected.id}`}
            currentUser={currentUser}
            contact={selected}
            incomingMessages={incoming}
          />
        ) : (
          <p style={s.placeholder}>← Select a user to start chatting</p>
        )}
      </div>
    </div>
  )
}

const s = {
  shell: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: {
    width: 230,
    minWidth: 230,       // prevent sidebar from shrinking when chat area is wide
    maxWidth: 230,
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa',
    overflow: 'hidden',  // contain everything inside the fixed width
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,              // space between text and button
    padding: '12px 16px',
    borderBottom: '1px solid #ddd',
    minWidth: 0,         // allow flex children to shrink below their content size
  },
  userInfo: {
    minWidth: 0,         // allows text to truncate rather than overflow
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  email: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    flexShrink: 0,       // never compress the button
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 4,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  offline: { background: '#fff3cd', color: '#856404', fontSize: 12, padding: '6px 12px', borderBottom: '1px solid #ffe08a' },
  label: { margin: '12px 16px 4px', fontSize: 11, color: '#888', letterSpacing: 1 },
  userBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14 },
  active: { background: '#e8f0fe', fontWeight: 'bold' },
  badge: { background: '#0070f3', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  placeholder: { margin: 'auto', color: '#aaa' },
  hint: { padding: '0 16px', fontSize: 13, color: '#aaa' },
}