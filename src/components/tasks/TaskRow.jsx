import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { differenceInDays, format } from 'date-fns'
import { startTimer } from '../timer/TimerControls'
import { formatSecsFriendly } from '../timer/TimerControls'

function formatMinutes(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function TaskRow({ task, isReadOnly, mode = 'weekly' }) {
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
  const isDaily = mode === 'daily'
  const isDone = task.status === 'done'
  const isWaiting = task.status === 'waiting'
  const waitingDays = task.waiting_since ? differenceInDays(new Date(), new Date(task.waiting_since)) : 0
  const isWaitingStale = isWaiting && waitingDays >= 3

  const actualSecs = task.actual_seconds || 0
  const estMin = task.estimated_minutes || 0
  const actualMin = Math.floor(actualSecs / 60)
  const overTime = estMin > 0 && actualMin > estMin

  // Carry-over info for daily
  const carriedFrom = task.carried_from_date || task.daily_date
  const carryDays = carriedFrom ? differenceInDays(new Date(), new Date(carriedFrom + 'T00:00:00')) : 0
  const carryLabel = carryDays > 0
    ? (carryDays === 1 ? `from ${format(new Date(carriedFrom + 'T00:00:00'), 'EEE')}` : `day ${carryDays + 1}`)
    : null

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const updateTask = async (updates) => {
    dispatch({ type: 'UPSERT_TASK', payload: { ...task, ...updates } })
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
    if (!hrMatch && !minMatch) { const n = parseFloat(t); if (!isNaN(n)) total = n < 10 ? n * 60 : n }
    return total > 0 ? Math.round(total) : null
  }

  const toggleDone = () => {
    if (isDone) updateTask({ status: 'todo', completed_at: null })
    else updateTask({ status: 'done', completed_at: new Date().toISOString() })
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

  const saveWaiting = () => {
    updateTask({ status: 'waiting', waiting_note: waitingNote, waiting_since: new Date().toISOString() })
    setShowWaitingInput(false)
  }

  const sendToDaily = async () => {
    const today = new Date().toISOString().split('T')[0]
    updateTask({ on_daily: true, daily_date: today })
    setShowMenu(false)
  }

  const removeFromDaily = async () => {
    updateTask({ on_daily: false, daily_date: null })
    setShowMenu(false)
  }

  const removeTask = () => {
    updateTask({ status: 'removed' })
    setShowMenu(false)
  }

  const handleTimerClick = () => {
    startTimer(task, state, dispatch)
  }

  const rowBg = isTimerActive && isDaily
    ? 'var(--color-accent-light)'
    : isWaitingStale ? 'var(--color-waiting-light)' : 'transparent'

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
      padding: '0 20px',
      background: rowBg,
      opacity: isDone ? 0.5 : 1,
      transition: 'background 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', minHeight: 44 }}>
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          disabled={isReadOnly}
          style={{
            width: 16, height: 16,
            border: `1.5px solid ${isDone ? 'var(--color-done)' : isWaiting ? 'var(--color-waiting)' : 'var(--color-border-strong)'}`,
            borderRadius: 2,
            background: isDone ? 'var(--color-done)' : 'transparent',
            cursor: isReadOnly ? 'default' : 'pointer',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          {isDone && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
          {isWaiting && <span style={{ color: 'var(--color-waiting)', fontSize: 9, lineHeight: 1 }}>⏳</span>}
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {editingTitle ? (
            <input
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(task.title) } }}
              autoFocus
              style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--color-accent)', padding: '0 0 2px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text)', background: 'transparent', outline: 'none' }}
            />
          ) : (
            <span
              onClick={() => !isReadOnly && setEditingTitle(true)}
              style={{ fontSize: '13px', color: 'var(--color-text)', textDecoration: isDone ? 'line-through' : 'none', cursor: isReadOnly ? 'default' : 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {task.title}
            </span>
          )}
          {isDaily && carryLabel && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-text-muted)', background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 2, padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {carryLabel}
            </span>
          )}
          {!isDaily && task.on_daily && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-accent)', flexShrink: 0 }}>◉</span>
          )}
        </div>

        {/* Right-side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Estimated time */}
          {editingEst ? (
            <input
              value={estVal}
              onChange={e => setEstVal(e.target.value)}
              onBlur={saveEst}
              onKeyDown={e => { if (e.key === 'Enter') saveEst(); if (e.key === 'Escape') { setEditingEst(false); setEstVal(task.estimated_time || '') } }}
              autoFocus
              placeholder="30m"
              style={{ width: 70, border: '1px solid var(--color-accent)', borderRadius: 2, padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', outline: 'none', background: 'var(--color-surface)' }}
            />
          ) : (
            <span
              className="mono"
              onClick={() => !isReadOnly && !isDaily && setEditingEst(true)}
              style={{ color: 'var(--color-text-secondary)', cursor: isReadOnly || isDaily ? 'default' : 'pointer', fontSize: '11px', minWidth: 24, textAlign: 'right' }}
            >
              {task.estimated_time || '—'}
            </span>
          )}

          {/* Actual time (daily only) */}
          {isDaily && actualSecs > 0 && (
            <>
              <span style={{ color: 'var(--color-border-strong)', fontSize: 10 }}>/</span>
              <span className="mono" style={{ fontSize: '11px', color: overTime ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                {formatSecsFriendly(actualSecs)}
                {overTime && <span style={{ marginLeft: 2 }}>⚠</span>}
              </span>
            </>
          )}

          {/* Waiting stale badge */}
          {isWaitingStale && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'var(--color-waiting)', color: 'white', padding: '1px 5px', borderRadius: 2 }}>
              {waitingDays}D
            </span>
          )}

          {/* Send to Daily (weekly only) */}
          {!isReadOnly && !isDaily && !task.on_daily && task.status !== 'done' && (
            <button
              onClick={sendToDaily}
              title="Send to Daily"
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                padding: '2px 7px',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.04em',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              → DAILY
            </button>
          )}

          {/* Timer play (daily only) */}
          {isDaily && !isReadOnly && task.status !== 'done' && (
            <button
              onClick={handleTimerClick}
              style={{
                background: isTimerActive && task.timer_running ? 'var(--color-accent)' : 'none',
                color: isTimerActive && task.timer_running ? 'white' : 'var(--color-text-secondary)',
                border: `1px solid ${isTimerActive && task.timer_running ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 2,
                width: 24, height: 24,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                flexShrink: 0,
              }}
              title="Start timer"
            >
              ▶
            </button>
          )}

          {/* Menu */}
          {!isReadOnly && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px 4px', fontSize: 14, lineHeight: 1 }}
              >
                ···
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 2px)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, zIndex: 50, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  {isDaily ? [
                    { label: 'Remove from Daily', action: removeFromDaily },
                    { label: 'Mark Done', action: toggleDone },
                    { label: 'Remove Task', action: removeTask, danger: true },
                  ] : [
                    { label: '→ Send to Daily', action: sendToDaily },
                    { label: task.status === 'waiting' ? 'Clear Waiting' : 'Flag as Waiting', action: task.status === 'waiting' ? () => updateTask({ status: 'todo', waiting_note: null, waiting_since: null }) : () => { setShowWaitingInput(true); setShowMenu(false) } },
                    { label: 'Remove', action: removeTask, danger: true },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', fontSize: '12px', color: item.danger ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer' }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Waiting input */}
      {showWaitingInput && (
        <div style={{ paddingBottom: 10 }}>
          <input
            value={waitingNote}
            onChange={e => setWaitingNote(e.target.value)}
            placeholder="What are you waiting for?"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') saveWaiting(); if (e.key === 'Escape') setShowWaitingInput(false) }}
            style={{ width: '100%', border: '1px solid var(--color-waiting)', borderRadius: 2, padding: '6px 10px', fontFamily: 'var(--font-sans)', fontSize: '12px', background: 'var(--color-waiting-light)', outline: 'none' }}
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
