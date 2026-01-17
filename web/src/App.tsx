import './App.css'
import SolicitationList from './components/SolicitationList'
import NarrativeEditor from './components/NarrativeEditor'
import PersonalInbox from './components/PersonalInbox'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginButton } from './components/LoginButton'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutGrid, UserCircle, Inbox } from 'lucide-react'

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
                <NavLink 
                  to="/narrative"
                  className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                >
                  <UserCircle size={16} /> Narrative
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
          <Route path="/inbox" element={user ? <PersonalInbox /> : <Navigate to="/" />} />
          <Route path="/narrative" element={user ? <NarrativeEditor /> : <Navigate to="/" />} />
          {/* Catch-all for undefined routes */}
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