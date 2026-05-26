import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import TaskRow from './TaskRow'
import AddTaskSheet from '../shared/AddTaskSheet'
import { v4 as uuidv4 } from 'uuid'
import { formatSecsFriendly } from '../timer/TimerControls'

function formatMinutes(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function minutesToLabel(min) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export default function WeeklyTaskList() {
  const { state, dispatch } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEstMinutes, setNewEstMinutes] = useState(0)

  const [showCompleted, setShowCompleted] = useState(true)

  const allTasks = state.tasks.filter(t => t.status !== 'removed')
  const tasks = allTasks.filter(t => t.status !== 'done')
  const completedTasks = allTasks.filter(t => t.status === 'done')
  const weekId = state.currentWeek?.id
  const isReadOnly = state.currentWeek?.status === 'closed'

  const projectedMin = tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const actualSecs = allTasks.reduce((s, t) => s + (t.actual_seconds || 0), 0)
  const actualMin = Math.floor(actualSecs / 60)

  const addTask = async () => {
    if (!newTitle.trim() || !weekId) return
    const estLabel = minutesToLabel(newEstMinutes)
    const task = {
      id: uuidv4(),
      week_id: weekId,
      title: newTitle.trim(),
      estimated_time: estLabel,
      estimated_minutes: newEstMinutes || null,
      actual_minutes: 0,
      actual_seconds: 0,
      status: 'todo',
      on_daily: false,
      timer_running: false,
      sort_order: tasks.length,
    }
    dispatch({ type: 'UPSERT_TASK', payload: task })
    setNewTitle('')
    setNewEstMinutes(0)
    setSheetOpen(false)
    const { data } = await supabase.from('tasks').insert(task).select().single()
    if (data) dispatch({ type: 'UPSERT_TASK', payload: data })
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Totals bar */}
        <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-canvas)', display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
          <span className="mono" style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
            PROJECTED <span style={{ color: 'var(--color-text)' }}>{formatMinutes(projectedMin)}</span>
          </span>
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <span className="mono" style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
            ACTUAL <span style={{ color: actualMin > projectedMin && projectedMin > 0 ? 'var(--color-accent)' : 'var(--color-text)' }}>{formatMinutes(actualMin)}</span>
          </span>
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <span className="mono" style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            {completedTasks.length}/{allTasks.length}
          </span>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {allTasks.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
              NO TASKS YET
            </div>
          )}
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} mode="weekly" />
          ))}
          {completedTasks.length > 0 && (
            <>
              <button
                onClick={() => setShowCompleted(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 20px', background: 'var(--color-canvas)', border: 'none', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-text-muted)', cursor: 'pointer', textAlign: 'left' }}
              >
                <span>{showCompleted ? '▾' : '▸'}</span>
                COMPLETED — {completedTasks.length}
              </button>
              {showCompleted && completedTasks.map(task => (
                <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} mode="weekly" />
              ))}
            </>
          )}
        </div>

        {/* Add task button */}
        {!isReadOnly && (
          <div style={{ flexShrink: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                width: '100%',
                padding: '10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              + ADD TASK
            </button>
          </div>
        )}
      </div>

      <AddTaskSheet
        visible={sheetOpen}
        title={newTitle}
        setTitle={setNewTitle}
        estimatedMinutes={newEstMinutes}
        setEstimatedMinutes={setNewEstMinutes}
        onAdd={addTask}
        onCancel={() => { setSheetOpen(false); setNewTitle(''); setNewEstMinutes(0) }}
      />
    </>
  )
}
