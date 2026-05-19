import { useState } from 'react'
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

export default function Header() {
  const { state, dispatch, loadWeekData } = useApp()
  const [showWeekPicker, setShowWeekPicker] = useState(false)

  const currentWeek = state.currentWeek

  const weekLabel = currentWeek
    ? `${format(new Date(currentWeek.start_date + 'T00:00:00'), 'MMM d')} – ${format(new Date(currentWeek.end_date + 'T00:00:00'), 'MMM d, yyyy')}`
    : '—'

  const isCurrentWeek = () => {
    if (!currentWeek) return false
    const { getMonday } = useApp()
    return currentWeek.start_date === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }

  const switchToWeek = async (week) => {
    dispatch({ type: 'SET_WEEK', payload: week })
    dispatch({ type: 'SET_LOADING', payload: true })
    await loadWeekData(week.id)
    dispatch({ type: 'SET_LOADING', payload: false })
    setShowWeekPicker(false)
  }

  const unsortedCount = state.intakeItems.filter(i => i.status === 'pending').length

  return (
    <header style={{
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      padding: '0 20px',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-text)',
      }}>
        TODO
      </div>

      {/* Week selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowWeekPicker(v => !v)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 2,
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.04em',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>WK</span>
          {weekLabel}
          <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>▾</span>
        </button>

        {showWeekPicker && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            minWidth: 220,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            {state.weeks.map(week => {
              const label = `${format(new Date(week.start_date + 'T00:00:00'), 'MMM d')} – ${format(new Date(week.end_date + 'T00:00:00'), 'MMM d, yyyy')}`
              const isCurrent = currentWeek?.id === week.id
              return (
                <button
                  key={week.id}
                  onClick={() => switchToWeek(week)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: isCurrent ? 'var(--color-canvas)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: isCurrent ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                  {week.status === 'closed' && (
                    <span style={{ marginLeft: 8, color: 'var(--color-text-muted)', fontSize: 9 }}>CLOSED</span>
                  )}
                  {isCurrent && (
                    <span style={{ marginLeft: 8, color: 'var(--color-accent)', fontSize: 9 }}>CURRENT</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right side — intake badge + new week */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {unsortedCount > 0 && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-accent)',
            letterSpacing: '0.05em',
          }}>
            {unsortedCount} INTAKE
          </div>
        )}
        {currentWeek?.status !== 'closed' && (
          <button style={{
            background: 'var(--color-text)',
            color: 'var(--color-surface)',
            border: 'none',
            borderRadius: 2,
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
            New Week
          </button>
        )}
      </div>
    </header>
  )
}
