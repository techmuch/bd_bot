import './App.css'
import SolicitationList from './components/SolicitationList'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BD_Bot Intelligence Portal</h1>
      </header>
      <main>
        <SolicitationList />
      </main>
    </div>
  )
}

export default App