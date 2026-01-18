import './App.css'
import SolicitationList from './components/SolicitationList'
import PersonalInbox from './components/PersonalInbox'
import UserProfile from './components/UserProfile'
import SolicitationDetail from './components/SolicitationDetail'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginButton } from './components/LoginButton'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutGrid, Inbox } from 'lucide-react'

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Authenticating...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="header-main">
            <h1>BD_Bot</h1>
            
            <nav className="nav-tabs">
            <NavLink 
              to="/"
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <LayoutGrid size={16} /> Library
            </NavLink>
            
            {user && (
              <>
                <NavLink 
                  to="/inbox"
                  className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                >
                  <Inbox size={16} /> Inbox
                </NavLink>
              </>
            )}
          </nav>

          <div style={{marginLeft: 'auto'}}>
            <LoginButton />
          </div>
        </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<SolicitationList />} />
          <Route path="/solicitation/:id" element={<SolicitationDetail />} />
          <Route path="/inbox" element={user ? <PersonalInbox /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App