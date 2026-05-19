import { useState } from 'react'
import Header from './Header'
import LeftPanel from '../left-panel/LeftPanel'
import RightPanel from '../tasks/RightPanel'
import WeeklyTaskList from '../tasks/WeeklyTaskList'
import DailyTaskList from '../daily/DailyTaskList'

export default function AppLayout() {
  const [mobileTab, setMobileTab] = useState('weekly')

  const TABS = [
    { id: 'left', label: 'LEFT' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'daily', label: 'DAILY' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      {/* Desktop two-panel */}
      <div className="desktop-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '35%', minWidth: 280, borderRight: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <LeftPanel />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RightPanel />
        </div>
      </div>

      {/* Mobile single-panel */}
      <div className="mobile-layout" style={{ flex: 1, overflow: 'hidden', display: 'none', flexDirection: 'column' }}>
        {mobileTab === 'left' && <LeftPanel />}
        {mobileTab === 'weekly' && <WeeklyTaskList />}
        {mobileTab === 'daily' && <DailyTaskList />}
      </div>

      {/* Mobile tab bar */}
      <div className="mobile-tab-nav" style={{ display: 'none', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 4px',
              background: mobileTab === tab.id ? 'var(--color-accent)' : 'var(--color-surface)',
              color: mobileTab === tab.id ? 'white' : 'var(--color-text-muted)',
              border: 'none',
              borderTop: '1px solid var(--color-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-layout { display: none !important; }
          .mobile-layout { display: flex !important; }
          .mobile-tab-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
