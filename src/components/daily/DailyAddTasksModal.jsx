import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

export default function DailyAddTasksModal({ onClose }) {
  const { state, dispatch } = useApp()

  const available = state.tasks.filter(
    t => !t.on_daily && t.status !== 'done' && t.status !== 'removed'
  )

  const addToDaily = async (task) => {
    const today = new Date().toISOString().split('T')[0]
    const updates = { on_daily: true, daily_date: today }
    dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
    await supabase.from('tasks').update(updates).eq('id', task.id)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,23,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderTop: '2px solid var(--color-accent)',
        borderRadius: '8px 8px 0 0',
        width: '100%',
        maxWidth: 700,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-text)', textTransform: 'uppercase' }}>Add to Today</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {available.length} task{available.length !== 1 ? 's' : ''} available from this week
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {available.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              ALL TASKS ARE ALREADY ON TODAY'S LIST
            </div>
          ) : (
            available.map(task => (
              <div key={task.id} style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  {task.estimated_time && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>{task.estimated_time}</div>
                  )}
                </div>
                <button
                  onClick={() => addToDaily(task)}
                  style={{
                    background: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 2,
                    padding: '5px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  + TODAY
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'var(--color-text)', color: 'white', border: 'none', borderRadius: 2, padding: '8px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', cursor: 'pointer' }}>DONE</button>
        </div>
      </div>
    </div>
  )
}
