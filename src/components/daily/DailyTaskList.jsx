import { useApp } from '../../context/AppContext'
import TaskRow from '../tasks/TaskRow'

export default function DailyTaskList() {
  const { state } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const isReadOnly = state.currentWeek?.status === 'closed'

  const dailyTasks = state.tasks.filter(
    t => t.on_daily && t.status !== 'removed'
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-canvas)',
        flexShrink: 0,
      }}>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          TODAY — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {dailyTasks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
            NO TASKS — GO TO WEEKLY AND SEND TASKS HERE
          </div>
        ) : (
          dailyTasks.map(task => (
            <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} />
          ))
        )}
      </div>
    </div>
  )
}
