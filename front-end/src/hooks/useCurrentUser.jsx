import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const UserContext = createContext(null)
const STORAGE_KEY = 'communicator:currentUser'


function normalise(raw) {
  return { id: raw.userId, username: raw.username, email: raw.email }
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      setUsers([])
      return
    }
    api.getUsers().then(setUsers).catch(console.error)
  }, [currentUser])

  const register = useCallback(async (username, email, password) => {
    const raw = await api.register(username, email, password)
    setCurrentUser(normalise(raw))
  }, [])

  const login = useCallback(async (email, password) => {
    const raw = await api.login(email, password)
    setCurrentUser(normalise(raw))
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setCurrentUser(null)
    setUsers([])
  }, [])

  return (
    <UserContext.Provider value={{ currentUser, users, register, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useCurrentUser must be used inside <UserProvider>')
  return ctx
}