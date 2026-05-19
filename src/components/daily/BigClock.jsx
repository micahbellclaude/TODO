import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { elapsedSeconds, formatSecs, formatSecsFriendly, pauseTimer } from '../timer/TimerControls'

export default function BigClock() {
  const { state, dispatch } = useApp()
  const [display, setDisplay] = useState('00:00')
  const intervalRef = useRef(null)

  const activeTaskId = state.activeTimerTaskId
  const activeTask = activeTaskId ? state.tasks.find(t => t.id === activeTaskId) : null
  const isVisible = !!activeTask

  useEffect(() => {
    if (activeTask && activeTask.timer_running && activeTask.timer_started_at) {
      const tick = () => {
        const total = (activeTask.actual_seconds || 0) + elapsedSeconds(activeTask.timer_started_at)
        setDisplay(formatSecs(total))
      }
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
      if (activeTask) {
        const total = activeTask.actual_seconds || 0
        setDisplay(formatSecs(total))
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [activeTask?.id, activeTask?.timer_running, activeTask?.timer_started_at, activeTask?.actual_seconds])

  const handlePause = () => {
    if (activeTask) pauseTimer(activeTask, dispatch)
  }

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: isVisible ? '200px' : '0px',
      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
    }}>
      <div style={{
        background: 'var(--color-accent)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {/* Task name */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {activeTask?.title || ''}
        </div>

        {/* Main row: time + controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Running time */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '56px',
            fontWeight: 500,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {display}
          </div>

          {/* Right side: est + pause */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            {activeTask?.estimated_time && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
                EST {activeTask.estimated_time}
              </div>
            )}
            <button
              onClick={handlePause}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 3,
                padding: '8px 18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ⏸ PAUSE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
