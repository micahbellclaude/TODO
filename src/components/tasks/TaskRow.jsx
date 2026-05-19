import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { differenceInDays } from 'date-fns'
import TimerControls from '../timer/TimerControls'

function formatMinutes(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const STATUS_COLORS = {
  todo: 'var(--color-text-muted)',
  in_progress: 'var(--color-accent)',
  done: 'var(--color-done)',
  waiting: 'var(--color-waiting)',
  removed: 'var(--color-removed)',
}

export default function TaskRow({ task, isReadOnly }) {
  const { state, dispatch } = useApp()
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingEst, setEditingEst] = useState(false)
  const [titleVal, setTitleVal] = useState(task.title)
  const [estVal, setEstVal] = useState(task.estimated_time || '')
  const [showWaitingInput, setShowWaitingInput] = useState(false)
  const [waitingNote, setWaitingNote] = useState(task.waiting_note || '')
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const isTimerActive = state.activeTimerTaskId === task.id
  const waitingDays = task.waiting_since
    ? differenceInDays(new Date(), new Date(task.waiting_since))
    : 0
  const isWaitingStale = task.status === 'waiting' && waitingDays >= 3

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const updateTask = async (updates) => {
    const updated = { ...task, ...updates }
    dispatch({ type: 'UPSERT_TASK', payload: updated })
    await supabase.from('tasks').update(updates).eq('id', task.id)
  }

  const parseEstimate = (text) => {
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

  const toggleDone = () => {
    if (task.status === 'done') {
      updateTask({ status: 'todo', completed_at: null })
    } else {
      updateTask({ status: 'done', completed_at: new Date().toISOString() })
    }
  }

  const saveTitle = () => {
    setEditingTitle(false)
    if (titleVal.trim() && titleVal !== task.title) updateTask({ title: titleVal.trim() })
    else setTitleVal(task.title)
  }

  const saveEst = () => {
    setEditingEst(false)
    const estMin = parseEstimate(estVal)
    updateTask({ estimated_time: estVal.trim() || null, estimated_minutes: estMin })
  }

  const flagWaiting = () => {
    setShowWaitingInput(true)
    setShowMenu(false)
  }

  const saveWaiting = () => {
    updateTask({ status: 'waiting', waiting_note: waitingNote, waiting_since: new Date().toISOString() })
    setShowWaitingInput(false)
  }

  const removeTask = () => {
    updateTask({ status: 'removed' })
    setShowMenu(false)
  }

  const sendToDaily = () => {
    updateTask({ on_daily: true, daily_date: new Date().toISOString().split('T')[0] })
    setShowMenu(false)
  }

  const isDone = task.status === 'done'
  const isWaiting = task.status === 'waiting'
  const overTime = task.estimated_minutes && task.actual_minutes > task.estimated_minutes
  const overBy = overTime ? task.actual_minutes - task.estimated_minutes : 0

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
      padding: '0 20px',
      background: isTimerActive ? 'var(--color-accent-light)' : isWaitingStale ? 'var(--color-waiting-light)' : 'transparent',
      opacity: isDone ? 0.55 : 1,
      transition: 'background 0.2s, opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', minHeight: 44 }}>
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          disabled={isReadOnly}
          style={{
            width: 16,
            height: 16,
            border: `1.5px solid ${isDone ? 'var(--color-done)' : isWaiting ? 'var(--color-waiting)' : 'var(--color-border-strong)'}`,
            borderRadius: 2,
            background: isDone ? 'var(--color-done)' : 'transparent',
            cursor: isReadOnly ? 'default' : 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {isDone && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
          {isWaiting && <span style={{ color: 'var(--color-waiting)', fontSize: 9, lineHeight: 1 }}>⏳</span>}
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(task.title) } }}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid var(--color-accent)',
                padding: '0 0 2px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--color-text)',
                background: 'transparent',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={() => !isReadOnly && setEditingTitle(true)}
              style={{
                fontSize: '13px',
                color: 'var(--color-text)',
                textDecoration: isDone ? 'line-through' : 'none',
                cursor: isReadOnly ? 'default' : 'text',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Time display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Est */}
          {editingEst ? (
            <input
              value={estVal}
              onChange={e => setEstVal(e.target.value)}
              onBlur={saveEst}
              onKeyDown={e => { if (e.key === 'Enter') saveEst(); if (e.key === 'Escape') { setEditingEst(false); setEstVal(task.estimated_time || '') } }}
              autoFocus
              placeholder="30m"
              style={{
                width: 70,
                border: '1px solid var(--color-accent)',
                borderRadius: 2,
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                outline: 'none',
                background: 'var(--color-surface)',
              }}
            />
          ) : (
            <span
              className="mono"
              onClick={() => !isReadOnly && setEditingEst(true)}
              style={{ color: 'var(--color-text-secondary)', cursor: isReadOnly ? 'default' : 'pointer', minWidth: 30, textAlign: 'right' }}
            >
              {task.estimated_time || '—'}
            </span>
          )}

          {task.actual_minutes > 0 && (
            <>
              <span style={{ color: 'var(--color-border-strong)', fontSize: 10 }}>/</span>
              <span className="mono" style={{ color: overTime ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                {formatMinutes(task.actual_minutes)}
                {overTime && <span style={{ marginLeft: 3 }}>⚠</span>}
              </span>
            </>
          )}

          {/* Waiting stale badge */}
          {isWaitingStale && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              background: 'var(--color-waiting)',
              color: 'white',
              padding: '1px 5px',
              borderRadius: 2,
            }}>
              {waitingDays}D
            </span>
          )}

          {/* Timer controls */}
          {!isReadOnly && task.status !== 'done' && (
            <TimerControls task={task} />
          )}

          {/* Menu */}
          {!isReadOnly && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ···
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 2px)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  zIndex: 50,
                  minWidth: 160,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}>
                  {[
                    { label: 'Send to Daily', action: sendToDaily },
                    { label: task.status === 'waiting' ? 'Clear Waiting' : 'Flag as Waiting', action: task.status === 'waiting' ? () => updateTask({ status: 'todo', waiting_note: null, waiting_since: null }) : flagWaiting },
                    { label: 'Remove', action: removeTask, danger: true },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        color: item.danger ? 'var(--color-accent)' : 'var(--color-text)',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Waiting note input */}
      {showWaitingInput && (
        <div style={{ paddingBottom: 10 }}>
          <input
            value={waitingNote}
            onChange={e => setWaitingNote(e.target.value)}
            placeholder="What are you waiting for?"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') saveWaiting(); if (e.key === 'Escape') setShowWaitingInput(false) }}
            style={{
              width: '100%',
              border: '1px solid var(--color-waiting)',
              borderRadius: 2,
              padding: '6px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--color-text)',
              background: 'var(--color-waiting-light)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={saveWaiting} style={{ background: 'var(--color-waiting)', color: 'white', border: 'none', borderRadius: 2, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>SAVE</button>
            <button onClick={() => setShowWaitingInput(false)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Waiting note display */}
      {isWaiting && task.waiting_note && !showWaitingInput && (
        <div style={{ paddingBottom: 8, paddingLeft: 26 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-waiting)', fontStyle: 'italic' }}>
            Waiting: {task.waiting_note}
          </span>
        </div>
      )}
    </div>
  )
}
