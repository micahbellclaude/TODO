import { useApp } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'

export default function App() {
  const { state } = useApp()

  if (state.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
        LOADING...
      </div>
    )
  }

  if (state.error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-accent)' }}>
        ERROR: {state.error}
      </div>
    )
  }

  return <AppLayout />
}
