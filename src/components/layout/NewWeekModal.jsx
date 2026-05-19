import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export default function NewWeekModal({ onClose }) {
  const { state, dispatch, loadWeekData, DEFAULT_SECTIONS } = useApp()
  const [taskDecisions, setTaskDecisions] = useState(() => {
    const incomplete = state.tasks.filter(t => t.status !== 'done' && t.status !== 'removed')
    return Object.fromEntries(incomplete.map(t => [t.id, 'carry']))
  })
  const [step, setStep] = useState('review') // 'review' | 'creating'

  const incompleteTasks = state.tasks.filter(t => t.status !== 'done' && t.status !== 'removed')

  const setDecision = (taskId, decision) => {
    setTaskDecisions(d => ({ ...d, [taskId]: decision }))
  }

  const createNewWeek = async () => {
    setStep('creating')

    // Close current week
    await supabase.from('weeks').update({ status: 'closed' }).eq('id', state.currentWeek.id)

    // Calculate next week dates
    const nextMonday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
    const nextSunday = endOfWeek(nextMonday, { weekStartsOn: 1 })
    const startDate = format(nextMonday, 'yyyy-MM-dd')
    const endDate = format(nextSunday, 'yyyy-MM-dd')

    // Check if next week already exists
    const { data: existingWeeks } = await supabase.from('weeks').select('*').eq('start_date', startDate)
    let newWeek = existingWeeks?.[0]

    if (!newWeek) {
      const { data } = await supabase
        .from('weeks')
        .insert({ start_date: startDate, end_date: endDate, status: 'active' })
        .select()
        .single()
      newWeek = data
    }

    // Seed default sections
    const sections = DEFAULT_SECTIONS.map(s => ({ ...s, id: uuidv4(), week_id: newWeek.id }))
    await supabase.from('left_sections').insert(sections)

    // Carry over tasks
    const toCarry = incompleteTasks.filter(t => taskDecisions[t.id] === 'carry' || taskDecisions[t.id] === 'edit')
    if (toCarry.length > 0) {
      const carried = toCarry.map((t, i) => ({
        id: uuidv4(),
        week_id: newWeek.id,
        title: t.title,
        estimated_time: t.estimated_time,
        estimated_minutes: t.estimated_minutes,
        actual_minutes: 0,
        status: 'todo',
        on_daily: false,
        timer_running: false,
        carry_from_task_id: t.id,
        carried_from_date: t.daily_date || state.currentWeek.start_date,
        sort_order: i,
      }))
      await supabase.from('tasks').insert(carried)
    }

    // Update local state
    const { data: allWeeks } = await supabase.from('weeks').select('*').order('start_date', { ascending: false })
    dispatch({ type: 'SET_WEEKS', payload: allWeeks || [] })
    dispatch({ type: 'SET_WEEK', payload: newWeek })
    await loadWeekData(newWeek.id)

    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(26,25,23,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      backdropFilter: 'blur(2px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        width: '90%',
        maxWidth: 560,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-text)', textTransform: 'uppercase' }}>
              Start New Week
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {incompleteTasks.length} incomplete task{incompleteTasks.length !== 1 ? 's' : ''} to review
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {step === 'creating' ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
            CREATING NEW WEEK...
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {incompleteTasks.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  NO INCOMPLETE TASKS — READY TO START FRESH
                </div>
              ) : (
                incompleteTasks.map(task => (
                  <div key={task.id} style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      {task.estimated_time && (
                        <div className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>{task.estimated_time}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {[
                        { value: 'carry', label: 'CARRY' },
                        { value: 'remove', label: 'REMOVE' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDecision(task.id, opt.value)}
                          style={{
                            background: taskDecisions[task.id] === opt.value
                              ? (opt.value === 'remove' ? 'var(--color-text)' : 'var(--color-accent)')
                              : 'none',
                            color: taskDecisions[task.id] === opt.value ? 'white' : 'var(--color-text-muted)',
                            border: `1px solid ${taskDecisions[task.id] === opt.value ? 'transparent' : 'var(--color-border)'}`,
                            borderRadius: 2,
                            padding: '3px 8px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-canvas)',
            }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {Object.values(taskDecisions).filter(d => d === 'carry').length} carrying over
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 2, padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer', letterSpacing: '0.06em' }}>CANCEL</button>
                <button onClick={createNewWeek} style={{ background: 'var(--color-text)', color: 'var(--color-surface)', border: 'none', borderRadius: 2, padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', cursor: 'pointer' }}>START NEW WEEK →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
