import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

export function elapsedSeconds(startedAt) {
  if (!startedAt) return 0
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

export function formatSecs(secs) {
  if (!secs && secs !== 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatSecsFriendly(secs) {
  if (!secs && secs !== 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return `${secs}s`
}

export async function startTimer(task, state, dispatch) {
  // Pause any other running timer first
  if (state.activeTimerTaskId && state.activeTimerTaskId !== task.id) {
    const other = state.tasks.find(t => t.id === state.activeTimerTaskId)
    if (other) {
      const accumulated = (other.actual_seconds || 0) + elapsedSeconds(other.timer_started_at)
      const updates = { timer_running: false, timer_started_at: null, actual_seconds: accumulated, actual_minutes: Math.floor(accumulated / 60) }
      dispatch({ type: 'UPSERT_TASK', payload: { ...other, ...updates } })
      await supabase.from('tasks').update(updates).eq('id', other.id)
    }
  }
  const now = new Date().toISOString()
  const updates = { timer_running: true, timer_started_at: now, status: 'in_progress' }
  dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
  dispatch({ type: 'SET_ACTIVE_TIMER', payload: task.id })
  await supabase.from('tasks').update(updates).eq('id', task.id)
}

export async function pauseTimer(task, dispatch) {
  const accumulated = (task.actual_seconds || 0) + elapsedSeconds(task.timer_started_at)
  const updates = {
    timer_running: false,
    timer_started_at: null,
    actual_seconds: accumulated,
    actual_minutes: Math.floor(accumulated / 60),
  }
  dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
  dispatch({ type: 'SET_ACTIVE_TIMER', payload: null })
  await supabase.from('tasks').update(updates).eq('id', task.id)
}

// Small inline play/pause button used in daily task rows
export default function TimerControls({ task }) {
  const { state, dispatch } = useApp()
  const isActive = state.activeTimerTaskId === task.id

  const handleStart = () => startTimer(task, state, dispatch)
  const handlePause = () => pauseTimer(task, dispatch)

  return isActive && task.timer_running ? (
    <button
      onClick={handlePause}
      title="Pause"
      style={{
        background: 'var(--color-accent)',
        color: 'white',
        border: 'none',
        borderRadius: 2,
        width: 24,
        height: 24,
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
      onClick={handleStart}
      title="Start timer"
      style={{
        background: 'none',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 2,
        width: 24,
        height: 24,
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
  )
}
