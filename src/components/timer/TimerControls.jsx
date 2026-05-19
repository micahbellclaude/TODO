import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

function elapsed(startedAt) {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

function formatSecs(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerControls({ task }) {
  const { state, dispatch } = useApp()
  const [display, setDisplay] = useState('')
  const intervalRef = useRef(null)
  const syncRef = useRef(null)

  const isActive = state.activeTimerTaskId === task.id
  const anotherActive = state.activeTimerTaskId && state.activeTimerTaskId !== task.id

  useEffect(() => {
    if (isActive && task.timer_running && task.timer_started_at) {
      const tick = () => {
        const base = (task.actual_minutes || 0) * 60
        const delta = elapsed(task.timer_started_at)
        setDisplay(formatSecs(base + delta))
      }
      tick()
      intervalRef.current = setInterval(tick, 1000)

      // persist actual_minutes every 30s
      syncRef.current = setInterval(async () => {
        const base = (task.actual_minutes || 0) * 60
        const delta = elapsed(task.timer_started_at)
        const newMin = Math.round((base + delta) / 60)
        await supabase.from('tasks').update({ actual_minutes: newMin }).eq('id', task.id)
      }, 30000)
    } else {
      clearInterval(intervalRef.current)
      clearInterval(syncRef.current)
      setDisplay('')
    }
    return () => { clearInterval(intervalRef.current); clearInterval(syncRef.current) }
  }, [isActive, task.timer_running, task.timer_started_at, task.actual_minutes, task.id])

  const startTimer = async () => {
    // stop any other running timer first
    if (state.activeTimerTaskId) {
      const otherTask = state.tasks.find(t => t.id === state.activeTimerTaskId)
      if (otherTask) {
        const base = (otherTask.actual_minutes || 0) * 60
        const delta = elapsed(otherTask.timer_started_at)
        const newMin = Math.round((base + delta) / 60)
        const updates = { timer_running: false, timer_started_at: null, actual_minutes: newMin }
        dispatch({ type: 'UPSERT_TASK', payload: { ...otherTask, ...updates } })
        await supabase.from('tasks').update(updates).eq('id', otherTask.id)
      }
    }
    const now = new Date().toISOString()
    const updates = { timer_running: true, timer_started_at: now, status: 'in_progress' }
    dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
    dispatch({ type: 'SET_ACTIVE_TIMER', payload: task.id })
    await supabase.from('tasks').update(updates).eq('id', task.id)
  }

  const pauseTimer = async () => {
    const base = (task.actual_minutes || 0) * 60
    const delta = elapsed(task.timer_started_at)
    const newMin = Math.round((base + delta) / 60)
    const updates = { timer_running: false, timer_started_at: null, actual_minutes: newMin }
    dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
    dispatch({ type: 'SET_ACTIVE_TIMER', payload: null })
    await supabase.from('tasks').update(updates).eq('id', task.id)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {isActive && display && (
        <span className="mono" style={{ fontSize: '11px', color: 'var(--color-accent)', minWidth: 50 }}>
          {display}
        </span>
      )}
      {isActive && task.timer_running ? (
        <button
          onClick={pauseTimer}
          title="Pause timer"
          style={{
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 2,
            width: 22,
            height: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          ⏸
        </button>
      ) : (
        <button
          onClick={startTimer}
          title={anotherActive ? 'Switch timer to this task' : 'Start timer'}
          style={{
            background: anotherActive ? 'none' : 'none',
            color: anotherActive ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 2,
            width: 22,
            height: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            flexShrink: 0,
          }}
        >
          ▶
        </button>
      )}
    </div>
  )
}
