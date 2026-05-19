import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function IntakeSection() {
  const { state, dispatch } = useApp()
  const [newItem, setNewItem] = useState('')

  const pending = state.intakeItems.filter(i => i.status === 'pending')
  const weekId = state.currentWeek?.id

  const addItem = async (e) => {
    e.preventDefault()
    if (!newItem.trim() || !weekId) return
    const item = { id: uuidv4(), week_id: weekId, title: newItem.trim(), status: 'pending' }
    dispatch({ type: 'UPSERT_INTAKE', payload: item })
    setNewItem('')
    const { data } = await supabase.from('intake_items').insert(item).select().single()
    if (data) dispatch({ type: 'UPSERT_INTAKE', payload: data })
  }

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: pending.length > 0 ? '1px solid var(--color-border)' : 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
          INTAKE
        </span>
        {pending.length > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', background: 'var(--color-accent)', color: 'white', borderRadius: 2, padding: '1px 6px' }}>
            {pending.length}
          </span>
        )}
      </div>

      {pending.map(item => (
        <IntakeItem key={item.id} item={item} />
      ))}

      <form onSubmit={addItem} style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Capture something..."
          style={{
            flex: 1,
            border: 'none',
            borderBottom: '1px solid var(--color-border)',
            padding: '4px 0',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'var(--color-text)',
            background: 'transparent',
            outline: 'none',
          }}
        />
      </form>
    </div>
  )
}

function IntakeItem({ item }) {
  const { state, dispatch } = useApp()
  const [sorting, setSorting] = useState(false)
  const [estTime, setEstTime] = useState('')

  const sortToTask = async () => {
    if (!state.currentWeek?.id) return
    const task = {
      id: uuidv4(),
      week_id: state.currentWeek.id,
      title: item.title,
      estimated_time: estTime.trim() || null,
      estimated_minutes: null,
      actual_minutes: 0,
      status: 'todo',
      on_daily: false,
      timer_running: false,
      sort_order: state.tasks.length,
    }
    dispatch({ type: 'UPSERT_TASK', payload: task })
    const updates = { status: 'sorted', sorted_to_task_id: task.id }
    dispatch({ type: 'UPSERT_INTAKE', payload: { ...item, ...updates } })
    setSorting(false)
    await Promise.all([
      supabase.from('tasks').insert(task),
      supabase.from('intake_items').update(updates).eq('id', item.id),
    ])
  }

  const removeItem = async () => {
    dispatch({ type: 'REMOVE_INTAKE', payload: item.id })
    await supabase.from('intake_items').delete().eq('id', item.id)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', padding: '6px 12px' }}>
      {sorting ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={estTime}
            onChange={e => setEstTime(e.target.value)}
            placeholder="Est. time (e.g. 30m)"
            autoFocus
            style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', outline: 'none' }}
            onKeyDown={e => { if (e.key === 'Enter') sortToTask(); if (e.key === 'Escape') setSorting(false) }}
          />
          <button onClick={sortToTask} style={{ background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 2, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>→ TASK</button>
          <button onClick={() => setSorting(false)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--color-accent)', fontSize: 10, flexShrink: 0, lineHeight: 1 }}>•</span>
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text)' }}>{item.title}</span>
          <button onClick={() => setSorting(true)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer', letterSpacing: '0.04em' }}>SORT →</button>
          <button onClick={removeItem} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}>✕</button>
        </div>
      )}
    </div>
  )
}
