import { useRef, useEffect } from 'react'
import TimeWheel from './TimeWheel'

function minutesToLabel(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export default function AddTaskSheet({ visible, title, setTitle, estimatedMinutes, setEstimatedMinutes, onAdd, onCancel }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  const estLabel = minutesToLabel(estimatedMinutes)

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          onClick={onCancel}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,23,0.3)', zIndex: 290 }}
        />
      )}

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: 'var(--color-surface)',
        borderTop: '2px solid var(--color-accent)',
        borderRadius: '8px 8px 0 0',
        padding: '20px 24px 32px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{ width: 36, height: 3, background: 'var(--color-border)', borderRadius: 2, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            New Task
          </span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
        </div>

        {/* Title input */}
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && title.trim()) onAdd()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder="What needs to get done?"
          style={{
            width: '100%',
            border: 'none',
            borderBottom: '2px solid var(--color-border)',
            padding: '8px 0',
            fontFamily: 'var(--font-sans)',
            fontSize: '18px',
            color: 'var(--color-text)',
            background: 'transparent',
            outline: 'none',
          }}
        />

        {/* Time wheel */}
        <TimeWheel onChange={setEstimatedMinutes} />

        {/* Confirm */}
        <button
          onClick={onAdd}
          disabled={!title.trim()}
          style={{
            width: '100%',
            maxWidth: 320,
            background: title.trim() ? 'var(--color-accent)' : 'var(--color-border)',
            color: title.trim() ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            borderRadius: 2,
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            cursor: title.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {estLabel ? `ADD — ${estLabel}` : 'ADD TASK'}
        </button>
      </div>
    </>
  )
}
