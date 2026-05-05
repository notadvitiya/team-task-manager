// api/client.js
// One axios instance that the whole app uses.
// Automatically attaches the JWT token to every request.

import axios from 'axios'

const api = axios.create({
  // In production, VITE_API_URL is your deployed backend URL.
  // In development, Vite's proxy forwards /api to localhost:5000.
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' }
})

// REQUEST interceptor: runs before every request is sent.
// Reads the token from localStorage and adds it to the Authorization header.
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE interceptor: runs when a response comes back.
// If the server says 401 (Unauthorized), the token is expired — log the user out.
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
