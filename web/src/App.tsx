import './App.css'
import SolicitationList from './components/SolicitationList'
import PersonalInbox from './components/PersonalInbox'
import UserProfile from './components/UserProfile'
import SolicitationDetail from './components/SolicitationDetail'
import LandingPage from './components/LandingPage'
import FeedbackApp from './components/FeedbackApp'
import DeveloperApp from './components/DeveloperApp'
import IRADApp from './components/IRADApp'
import StrategyApp from './components/StrategyApp'
import ChatPanel from './components/ChatPanel'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ChatProvider } from './context/ChatContext'
import { LoginButton } from './components/LoginButton'
import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Inbox, ListTodo, FileCode, Target, Briefcase, ClipboardCheck, Network } from 'lucide-react'

function AppContent() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (isLoading) {
    return <div className="loading">Authenticating...</div>;
  }

  // Nav Context Detection
  const isBDBot = location.pathname.startsWith('/library') || location.pathname.startsWith('/inbox') || location.pathname.startsWith('/solicitation');
  const isDeveloper = location.pathname.startsWith('/developer');
  const isIRAD = location.pathname.startsWith('/irad');
  const isStrategy = location.pathname.startsWith('/strategy');

  return (
    <div className="app-container" style={{paddingRight: isChatOpen ? '400px' : '0', transition: 'padding-right 0.3s ease-in-out'}}>
      <header className="app-header">
        <div className="header-container">
          <div className="header-main">
            <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-brand)', fontFamily: 'var(--font-family, inherit)' }}>JOSHUA</h1>
            </NavLink>
            
            <nav className="nav-tabs" style={{ marginLeft: '2rem' }}>
              {user && isStrategy && (
                <>
                  <NavLink
                    to="/strategy/goals"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <Target size={16} /> Goals
                  </NavLink>
                  <NavLink
                    to="/strategy/network"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <Network size={16} /> Network
                  </NavLink>
                </>
              )}
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
              {user && isDeveloper && (
                <>
                  <NavLink
                    to="/developer/tasks"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <ListTodo size={16} /> Task List
                  </NavLink>
                  <NavLink
                    to="/developer/requirements"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <FileCode size={16} /> Requirements
                  </NavLink>
                </>
              )}
              {user && isIRAD && (
                <>
                  <NavLink
                    to="/irad/strategy"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <Target size={16} /> Strategy
                  </NavLink>
                  <NavLink
                    to="/irad/portfolio"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <Briefcase size={16} /> Portfolio
                  </NavLink>
                  <NavLink
                    to="/irad/reviews"
                    className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                  >
                    <ClipboardCheck size={16} /> Reviews
                  </NavLink>
                </>
              )}
            </nav>

            <div style={{ marginLeft: 'auto' }}>
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
          <Route path="/developer/*" element={<DeveloperApp />} />
          <Route path="/irad/*" element={user ? <IRADApp /> : <Navigate to="/" />} />
          <Route path="/strategy/*" element={user ? <StrategyApp /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
}
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
