import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import TaskRow from './TaskRow'
import { v4 as uuidv4 } from 'uuid'

function formatMinutes(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function parseEstimate(text) {
  if (!text) return null
  const t = text.toLowerCase().trim()
  const hrMatch = t.match(/([\d.]+)\s*h/)
  const minMatch = t.match(/([\d.]+)\s*m/)
  let total = 0
  if (hrMatch) total += parseFloat(hrMatch[1]) * 60
  if (minMatch) total += parseFloat(minMatch[1])
  if (!hrMatch && !minMatch) {
    const num = parseFloat(t)
    if (!isNaN(num)) total = num < 10 ? num * 60 : num
  }
  return total > 0 ? Math.round(total) : null
}

export default function WeeklyTaskList() {
  const { state, dispatch } = useApp()
  const [newTitle, setNewTitle] = useState('')
  const [newEstimate, setNewEstimate] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)

  const tasks = state.tasks.filter(t => t.status !== 'removed')
  const weekId = state.currentWeek?.id
  const isReadOnly = state.currentWeek?.status === 'closed'

  // totals
  const projectedMin = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const actualMin = tasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !weekId) return
    const estMin = parseEstimate(newEstimate)
    const task = {
      id: uuidv4(),
      week_id: weekId,
      title: newTitle.trim(),
      estimated_time: newEstimate.trim() || null,
      estimated_minutes: estMin,
      actual_minutes: 0,
      status: 'todo',
      on_daily: false,
      timer_running: false,
      sort_order: tasks.length,
    }
    dispatch({ type: 'UPSERT_TASK', payload: task })
    setNewTitle('')
    setNewEstimate('')
    const { data, error } = await supabase.from('tasks').insert(task).select().single()
    if (data) dispatch({ type: 'UPSERT_TASK', payload: data })
  }

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Totals bar */}
      <div style={{
        padding: '8px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-canvas)',
        display: 'flex',
        gap: 20,
        flexShrink: 0,
      }}>
        <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>
          PROJECTED <span style={{ color: 'var(--color-text)' }}>{formatMinutes(projectedMin)}</span>
        </span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>
          ACTUAL <span style={{ color: actualMin > projectedMin && projectedMin > 0 ? 'var(--color-accent)' : 'var(--color-text)' }}>{formatMinutes(actualMin)}</span>
        </span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span className="mono" style={{ color: 'var(--color-text-muted)' }}>
          {tasks.filter(t => t.status === 'done').length}/{tasks.length} DONE
        </span>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {tasks.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
            NO TASKS — ADD ONE BELOW
          </div>
        )}
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} />
        ))}
      </div>

      {/* Add task form */}
      {!isReadOnly && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '12px 20px',
          background: 'var(--color-surface)',
          flexShrink: 0,
        }}>
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              style={{
                background: 'none',
                border: '1px dashed var(--color-border)',
                borderRadius: 2,
                width: '100%',
                padding: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              + ADD TASK
            </button>
          ) : (
            <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Task title"
                style={{
                  flex: 1,
                  border: '1px solid var(--color-border)',
                  borderRadius: 2,
                  padding: '6px 10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  background: 'var(--color-surface)',
                  outline: 'none',
                }}
                onBlur={() => { if (!newTitle) setAdding(false) }}
                onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewTitle(''); setNewEstimate('') }}}
                autoFocus
              />
              <input
                value={newEstimate}
                onChange={e => setNewEstimate(e.target.value)}
                placeholder="Est. (e.g. 30m, 1.5h)"
                style={{
                  width: 140,
                  border: '1px solid var(--color-border)',
                  borderRadius: 2,
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text)',
                  background: 'var(--color-surface)',
                  outline: 'none',
                }}
              />
              <button type="submit" style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                padding: '6px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}>ADD</button>
              <button type="button" onClick={() => { setAdding(false); setNewTitle(''); setNewEstimate('') }} style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                padding: '6px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}>✕</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
