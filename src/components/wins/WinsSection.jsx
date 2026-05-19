import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const EMPTY_WIN = { client_name: '', gross_or_net: 'gross', dollar_amount: '', campaign_timeframe: '', products_used: '' }

function formatDollar(val) {
  if (!val && val !== 0) return '—'
  return '$' + Number(val).toLocaleString()
}

export default function WinsSection({ isReadOnly }) {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_WIN)
  const [editId, setEditId] = useState(null)

  const wins = state.wins
  const weekId = state.currentWeek?.id

  const saveWin = async () => {
    if (!form.client_name.trim() || !weekId) return
    const win = {
      id: editId || uuidv4(),
      week_id: weekId,
      client_name: form.client_name.trim(),
      gross_or_net: form.gross_or_net,
      dollar_amount: form.dollar_amount ? parseFloat(form.dollar_amount) : null,
      campaign_timeframe: form.campaign_timeframe.trim(),
      products_used: form.products_used.trim(),
    }
    dispatch({ type: 'UPSERT_WIN', payload: win })
    setAdding(false)
    setEditId(null)
    setForm(EMPTY_WIN)

    if (editId) {
      await supabase.from('wins').update(win).eq('id', editId)
    } else {
      const { data } = await supabase.from('wins').insert(win).select().single()
      if (data) dispatch({ type: 'UPSERT_WIN', payload: data })
    }
  }

  const deleteWin = async (id) => {
    dispatch({ type: 'REMOVE_WIN', payload: id })
    await supabase.from('wins').delete().eq('id', id)
  }

  const startEdit = (win) => {
    setEditId(win.id)
    setForm({
      client_name: win.client_name || '',
      gross_or_net: win.gross_or_net || 'gross',
      dollar_amount: win.dollar_amount || '',
      campaign_timeframe: win.campaign_timeframe || '',
      products_used: win.products_used || '',
    })
    setAdding(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          {wins.length} WIN{wins.length !== 1 ? 'S' : ''}
        </span>
        {!isReadOnly && !adding && (
          <button
            onClick={() => { setAdding(true); setEditId(null); setForm(EMPTY_WIN) }}
            style={{ background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-accent)', cursor: 'pointer', letterSpacing: '0.04em' }}
          >
            + ADD
          </button>
        )}
      </div>

      {wins.map(win => (
        <div key={win.id} style={{
          border: '1px solid var(--color-border)',
          borderRadius: 2,
          padding: '8px 10px',
          marginBottom: 6,
          background: 'var(--color-canvas)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-text)', marginBottom: 2 }}>
                {win.client_name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 500 }}>
                  {formatDollar(win.dollar_amount)}
                </span>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {win.gross_or_net}
                </span>
                {win.campaign_timeframe && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{win.campaign_timeframe}</span>
                )}
              </div>
              {win.products_used && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 2 }}>{win.products_used}</div>
              )}
            </div>
            {!isReadOnly && (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => startEdit(win)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}>✎</button>
                <button onClick={() => deleteWin(win.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {adding && (
        <div style={{
          border: '1px solid var(--color-accent)',
          borderRadius: 2,
          padding: '10px',
          background: 'var(--color-accent-light)',
          marginTop: 6,
        }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <input
              autoFocus
              value={form.client_name}
              onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
              placeholder="Client name"
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setEditId(null) } }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={form.dollar_amount}
                onChange={e => setForm(f => ({ ...f, dollar_amount: e.target.value }))}
                placeholder="Amount"
                type="number"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, gross_or_net: f.gross_or_net === 'gross' ? 'net' : 'gross' }))}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 2,
                  padding: '4px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {form.gross_or_net}
              </button>
            </div>
            <input
              value={form.campaign_timeframe}
              onChange={e => setForm(f => ({ ...f, campaign_timeframe: e.target.value }))}
              placeholder="Campaign timeframe"
              style={inputStyle}
            />
            <input
              value={form.products_used}
              onChange={e => setForm(f => ({ ...f, products_used: e.target.value }))}
              placeholder="Products used"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveWin} style={{ background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 2, padding: '5px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.06em', cursor: 'pointer' }}>SAVE</button>
              <button onClick={() => { setAdding(false); setEditId(null); setForm(EMPTY_WIN) }} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 2, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  border: '1px solid var(--color-border)',
  borderRadius: 2,
  padding: '5px 8px',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  outline: 'none',
}
