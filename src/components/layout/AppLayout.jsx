import { useState } from 'react'
import Header from './Header'
import LeftPanel from '../left-panel/LeftPanel'
import RightPanel from '../tasks/RightPanel'
import WeeklyTaskList from '../tasks/WeeklyTaskList'
import DailyTaskList from '../daily/DailyTaskList'

const TABS = [
  { id: 'left', label: 'LEFT' },
  { id: 'weekly', label: 'WEEKLY' },
  { id: 'daily', label: 'DAILY' },
]

export default function AppLayout() {
  const [mobileTab, setMobileTab] = useState('weekly')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      {/* Mobile top tab bar — hidden on desktop */}
      <div className="mobile-tab-bar" style={{
        display: 'none',
        flexShrink: 0,
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: mobileTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: mobileTab === tab.id ? 'white' : 'var(--color-text-muted)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
      <div className="mobile-layout" style={{ flex: 1, overflow: 'hidden', display: 'none', flexDirection: 'column', position: 'relative' }}>
        {mobileTab === 'left' && <LeftPanel />}
        {mobileTab === 'weekly' && <WeeklyTaskList />}
        {mobileTab === 'daily' && <DailyTaskList />}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-layout { display: none !important; }
          .mobile-layout { display: flex !important; }
          .mobile-tab-bar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
