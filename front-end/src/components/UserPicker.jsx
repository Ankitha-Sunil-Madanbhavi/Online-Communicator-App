import { useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'

export function UserPicker() {
  const { users, loading, error, selectUser, createAndSelect } = useCurrentUser()
  const [newUsername, setNewUsername] = useState('')
  const [createError, setCreateError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    try {
      await createAndSelect(newUsername.trim())
    } catch (err) {
      setCreateError(err.message)
    }
  }

  if (loading) return <p style={s.hint}>Loading users…</p>

  return (
    <div style={s.page}>
      <h1>💬 Communicator</h1>

      <div style={s.section}>
        <h2>Sign in as</h2>
        {error && <p style={s.error}>{error}</p>}
        {users.length === 0
          ? <p style={s.hint}>No users yet — create one below.</p>
          : users.map((u) => (
            <button key={u.id} style={s.userBtn} onClick={() => selectUser(u)}>
              {u.username}
            </button>
          ))}
      </div>

      <div style={s.section}>
        <h2>New user</h2>
        <form onSubmit={handleCreate} style={s.form}>
          <input
            style={s.input}
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <button style={s.btn} type="submit">Create &amp; sign in</button>
        </form>
        {createError && <p style={s.error}>{createError}</p>}
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, fontFamily: 'sans-serif', gap: 8 },
  section: { width: 300, marginBottom: 16 },
  form: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '8px 10px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '8px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  userBtn: { display: 'block', width: '100%', marginBottom: 6, padding: '9px 12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontSize: 14 },
  error: { color: '#c0392b', fontSize: 13, margin: '4px 0 0' },
  hint: { color: '#888', fontSize: 13 },
}
