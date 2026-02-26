import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserProvider, useCurrentUser } from './hooks/useCurrentUser'
import { App } from './components/App'
import { AuthForm } from './components/AuthForm'

function Guard() {
  const { currentUser } = useCurrentUser()
  return currentUser ? <App /> : <AuthForm />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <Guard />
    </UserProvider>
  </StrictMode>
)
