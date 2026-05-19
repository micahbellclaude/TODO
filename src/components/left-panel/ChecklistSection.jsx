import { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

function parseItems(content) {
  if (!content) return []
  try { return JSON.parse(content) } catch { return [] }
}

export default function ChecklistSection({ section, isReadOnly, onUpdate }) {
  const [items, setItems] = useState(() => parseItems(section.content))
  const [newText, setNewText] = useState('')
  const inputRef = useRef(null)

  const save = (nextItems) => {
    setItems(nextItems)
    onUpdate(JSON.stringify(nextItems))
  }

  const addItem = () => {
    if (!newText.trim()) return
    const next = [...items, { id: uuidv4(), text: newText.trim(), checked: false }]
    save(next)
    setNewText('')
    inputRef.current?.focus()
  }

  const toggle = (id) => {
    save(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  const remove = (id) => {
    save(items.filter(i => i.id !== id))
  }

  const updateText = (id, text) => {
    save(items.map(i => i.id === id ? { ...i, text } : i))
  }

  return (
    <div>
      {items.length === 0 && isReadOnly && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Empty</div>
      )}

      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
          {/* Checkbox */}
          <button
            onClick={() => !isReadOnly && toggle(item.id)}
            disabled={isReadOnly}
            style={{
              width: 15,
              height: 15,
              border: `1.5px solid ${item.checked ? 'var(--color-done)' : 'var(--color-border-strong)'}`,
              borderRadius: 2,
              background: item.checked ? 'var(--color-done)' : 'transparent',
              cursor: isReadOnly ? 'default' : 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {item.checked && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>×</span>}
          </button>

          {/* Text */}
          <span
            style={{
              flex: 1,
              fontSize: '12px',
              color: item.checked ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: item.checked ? 'line-through' : 'none',
              lineHeight: 1.4,
            }}
          >
            {item.text}
          </span>

          {/* Remove */}
          {!isReadOnly && (
            <button
              onClick={() => remove(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--color-border-strong)', cursor: 'pointer', fontSize: 12, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add item input */}
      {!isReadOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}>
          <div style={{ width: 15, height: 15, border: '1.5px dashed var(--color-border)', borderRadius: 2, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setNewText('') }}
            placeholder="Add item..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--color-text)',
              outline: 'none',
              padding: '2px 0',
            }}
          />
          {newText && (
            <button
              onClick={addItem}
              style={{ background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-accent)', cursor: 'pointer', padding: '0 4px' }}
            >
              ↵
            </button>
          )}
        </div>
      )}
    </div>
  )
}
