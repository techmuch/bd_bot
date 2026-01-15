import './App.css'
import SolicitationList from './components/SolicitationList'
import { AuthProvider } from './context/AuthContext'
import { LoginButton } from './components/LoginButton'

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <header className="app-header">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h1>BD_Bot Intelligence Portal</h1>
            <LoginButton />
          </div>
        </header>
        <main>
          <SolicitationList />
        </main>
      </div>
    </AuthProvider>
  )
}

export default App