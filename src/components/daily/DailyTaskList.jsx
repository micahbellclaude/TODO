import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { format } from 'date-fns'
import TaskRow from '../tasks/TaskRow'
import BigClock from './BigClock'
import DailyAddTasksModal from './DailyAddTasksModal'
import { formatSecsFriendly } from '../timer/TimerControls'

function formatMinutes(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function DailyTaskList() {
  const { state } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)

  const isReadOnly = state.currentWeek?.status === 'closed'
  const dailyTasks = state.tasks.filter(t => t.on_daily && t.status !== 'removed')

  const projectedMin = dailyTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const actualSecs = dailyTasks.reduce((s, t) => s + (t.actual_seconds || 0), 0)
  const actualMin = Math.floor(actualSecs / 60)

  const availableCount = state.tasks.filter(
    t => !t.on_daily && t.status !== 'done' && t.status !== 'removed'
  ).length

  const today = format(new Date(), "EEEE, MMMM d").toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* BigClock slides in from top when timer runs */}
      <BigClock />

      {/* Date + totals header */}
      <div style={{
        padding: '10px 20px 8px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.06em', marginBottom: 6 }}>
          TODAY — {today}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            PROJECTED <span style={{ color: 'var(--color-text)' }}>{formatMinutes(projectedMin)}</span>
          </span>
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            ACTUAL <span style={{ color: actualMin > projectedMin && projectedMin > 0 ? 'var(--color-accent)' : 'var(--color-text)' }}>{formatMinutes(actualMin)}</span>
          </span>
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {dailyTasks.filter(t => t.status === 'done').length}/{dailyTasks.length} DONE
          </span>
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {dailyTasks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
            {availableCount > 0
              ? `${availableCount} TASK${availableCount !== 1 ? 'S' : ''} AVAILABLE — TAP + ADD TASKS BELOW`
              : 'NO TASKS — ADD SOME TO THIS WEEK FIRST'}
          </div>
        ) : (
          dailyTasks.map(task => (
            <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} mode="daily" />
          ))
        )}
      </div>

      {/* Add tasks button */}
      {!isReadOnly && (
        <div style={{ flexShrink: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--color-text)',
              color: 'var(--color-surface)',
              border: 'none',
              borderRadius: 2,
              width: '100%',
              padding: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            + ADD TASKS
            {availableCount > 0 && (
              <span style={{ background: 'var(--color-accent)', color: 'white', borderRadius: 2, padding: '1px 7px', fontSize: '10px' }}>
                {availableCount}
              </span>
            )}
          </button>
        </div>
      )}

      {showAddModal && <DailyAddTasksModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
