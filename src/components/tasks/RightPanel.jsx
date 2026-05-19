import { useState } from 'react'
import WeeklyTaskList from './WeeklyTaskList'
import DailyTaskList from '../daily/DailyTaskList'

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState('weekly') // 'weekly' | 'daily'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        {['weekly', 'daily'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'weekly' ? <WeeklyTaskList /> : <DailyTaskList />}
      </div>
    </div>
  )
}
