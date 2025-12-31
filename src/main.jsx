import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './main.css'
import { AuthProvider } from './contexts/AuthContext'
import { FollowProvider } from './contexts/FollowContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <FollowProvider>
        <App />
      </FollowProvider>
    </AuthProvider>
  </React.StrictMode>,
)
