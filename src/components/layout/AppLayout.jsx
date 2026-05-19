import { useState } from 'react'
import Header from './Header'
import LeftPanel from '../left-panel/LeftPanel'
import RightPanel from '../tasks/RightPanel'

export default function AppLayout() {
  const [mobileTab, setMobileTab] = useState('left') // 'left' | 'weekly' | 'daily'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      {/* Desktop two-panel layout */}
      <div className="desktop-layout" style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        gap: 0,
      }}>
        <div style={{
          width: '35%',
          minWidth: 300,
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <LeftPanel />
        </div>
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <RightPanel />
        </div>
      </div>

      {/* Mobile tab nav */}
      <div className="mobile-tab-nav" style={{ display: 'none' }}>
        {['left', 'weekly', 'daily'].map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1,
              padding: '10px',
              background: mobileTab === tab ? 'var(--color-text)' : 'transparent',
              color: mobileTab === tab ? 'var(--color-surface)' : 'var(--color-text-secondary)',
              border: 'none',
              borderTop: '1px solid var(--color-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-layout { display: none !important; }
          .mobile-tab-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
