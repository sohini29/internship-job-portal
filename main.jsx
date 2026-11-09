
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'
import Landing from './Landing.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminRegister from './AdminRegister.jsx'
import JobDetails from './JobDetails.jsx'

function MainApp() {
  const adminToken = localStorage.getItem('adminToken')

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

     <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin/register"
        element={<AdminRegister />}
      />

      <Route
        path="/admin"
        element={
          adminToken
            ? <Admin />
            : <Navigate to="/admin/login" replace />
        }
      />

      <Route path="/jobs/:id" element={<JobDetails />} />

      <Route path="*" element={<App />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  </StrictMode>
)
