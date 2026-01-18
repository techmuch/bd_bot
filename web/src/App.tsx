import './App.css'
import SolicitationList from './components/SolicitationList'
import PersonalInbox from './components/PersonalInbox'
import UserProfile from './components/UserProfile'
import SolicitationDetail from './components/SolicitationDetail'
import LandingPage from './components/LandingPage'
import FeedbackApp from './components/FeedbackApp'
import DeveloperApp from './components/DeveloperApp'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginButton } from './components/LoginButton'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Inbox } from 'lucide-react'

function AppContent() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading">Authenticating...</div>;
  }

  // Hide BD_Bot nav tabs if not in BD_Bot context (library/inbox/solicitation)
  const isBDBot = location.pathname.startsWith('/library') || location.pathname.startsWith('/inbox') || location.pathname.startsWith('/solicitation');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="header-main">
            <NavLink to="/" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
               <h1 style={{fontSize: '1.5rem', margin: 0, color: '#2c3e50'}}>Dev_Portal</h1>
            </NavLink>
            
            <nav className="nav-tabs" style={{marginLeft: '2rem'}}>
            {user && isBDBot && (
              <>
                <NavLink 
                  to="/library"
                  className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                >
                  <LayoutGrid size={16} /> Library
                </NavLink>
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/library" element={<SolicitationList />} />
          <Route path="/solicitation/:id" element={<SolicitationDetail />} />
          <Route path="/inbox" element={user ? <PersonalInbox /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/" />} />
          <Route path="/feedback" element={<FeedbackApp />} />
          <Route path="/developer" element={<DeveloperApp />} />
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