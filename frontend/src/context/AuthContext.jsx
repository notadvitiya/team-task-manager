// context/AuthContext.jsx
// React Context stores the logged-in user globally.
// Any component can call useAuth() to get the user or log out.
// This avoids "prop drilling" (passing user through every component).

import { createContext, useContext, useState } from 'react'
import api from '../api/client'

// Create the context object
const AuthContext = createContext(null)

// AuthProvider wraps the whole app and provides auth state to all children
export function AuthProvider({ children }) {
  // Initialize from localStorage so the user stays logged in on refresh
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  // Called after successful login or signup
  function login(token, userData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // Clears everything and redirects to login
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — just call useAuth() in any component
export function useAuth() {
  return useContext(AuthContext)
}
