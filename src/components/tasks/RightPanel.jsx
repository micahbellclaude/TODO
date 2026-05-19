import { useState } from 'react'
import WeeklyTaskList from './WeeklyTaskList'
import DailyTaskList from '../daily/DailyTaskList'

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState('weekly')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}>
        {['weekly', 'daily'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '11px 24px',
              background: activeTab === tab ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'weekly' ? <WeeklyTaskList /> : <DailyTaskList />}
      </div>
    </div>
  )
}
