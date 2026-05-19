import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import WinsSection from '../wins/WinsSection'
import ChecklistSection from './ChecklistSection'

const CHECKLIST_TYPES = ['checkins', 'sales_meeting']

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']

function SectionCard({ section, isReadOnly, onMoveUp, onMoveDown, isFirst, isLast }) {
  const { dispatch } = useApp()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(section.title)
  const [contentVal, setContentVal] = useState(section.content || '')
  const [editingContent, setEditingContent] = useState(false)
  const textareaRef = useRef(null)

  const update = async (updates) => {
    const updated = { ...section, ...updates }
    dispatch({ type: 'UPSERT_SECTION', payload: updated })
    await supabase.from('left_sections').update(updates).eq('id', section.id)
  }

  const saveTitle = () => {
    setEditingTitle(false)
    if (titleVal.trim() && titleVal !== section.title) update({ title: titleVal.trim() })
    else setTitleVal(section.title)
  }

  const saveContent = () => {
    setEditingContent(false)
    if (contentVal !== section.content) update({ content: contentVal })
  }

  const toggleProspecting = (day) => {
    const days = { ...(section.prospecting_days || {}), [day]: !section.prospecting_days?.[day] }
    update({ prospecting_days: days })
  }

  const removeSection = async () => {
    dispatch({ type: 'REMOVE_SECTION', payload: section.id })
    await supabase.from('left_sections').delete().eq('id', section.id)
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        padding: '7px 10px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-canvas)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {editingTitle ? (
          <input
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(section.title) } }}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              borderBottom: '1px solid var(--color-accent)',
              background: 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              outline: 'none',
              color: 'var(--color-text)',
            }}
          />
        ) : (
          <span
            onClick={() => !isReadOnly && setEditingTitle(true)}
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              cursor: isReadOnly ? 'default' : 'text',
              fontSize: '11px',
            }}
          >
            {section.title}
          </span>
        )}

        {!isReadOnly && (
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={onMoveUp} disabled={isFirst} style={reorderBtn} title="Move up">↑</button>
            <button onClick={onMoveDown} disabled={isLast} style={reorderBtn} title="Move down">↓</button>
            <button onClick={removeSection} style={{ ...reorderBtn, color: 'var(--color-text-muted)' }} title="Remove">✕</button>
          </div>
        )}
      </div>

      {/* Section body */}
      <div style={{ padding: '10px' }}>
        {section.type === 'wins' ? (
          <WinsSection isReadOnly={isReadOnly} />
        ) : CHECKLIST_TYPES.includes(section.type) ? (
          <ChecklistSection section={section} isReadOnly={isReadOnly} onUpdate={content => update({ content })} />
        ) : section.type === 'prospecting' ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '4px 0' }}>
            {DAYS.map(day => (
              <label key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: isReadOnly ? 'default' : 'pointer' }}>
                <div
                  onClick={() => !isReadOnly && toggleProspecting(day)}
                  style={{
                    width: 28,
                    height: 28,
                    border: `1.5px solid ${section.prospecting_days?.[day] ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: 2,
                    background: section.prospecting_days?.[day] ? 'var(--color-accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {section.prospecting_days?.[day] && <span style={{ color: 'white', fontSize: 13, fontWeight: 300, lineHeight: 1 }}>×</span>}
                </div>
                <span className="mono" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{day}</span>
              </label>
            ))}
          </div>
        ) : (
          editingContent ? (
            <textarea
              ref={textareaRef}
              value={contentVal}
              onChange={e => setContentVal(e.target.value)}
              onBlur={saveContent}
              autoFocus
              rows={4}
              style={{
                width: '100%',
                border: '1px solid var(--color-accent)',
                borderRadius: 2,
                padding: '6px 8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          ) : (
            <div
              onClick={() => !isReadOnly && setEditingContent(true)}
              style={{
                fontSize: '12px',
                color: contentVal ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontStyle: contentVal ? 'normal' : 'italic',
                cursor: isReadOnly ? 'default' : 'text',
                minHeight: 40,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {contentVal || 'Click to add notes...'}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function LeftSections() {
  const { state, dispatch } = useApp()
  const [addingSection, setAddingSection] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const isReadOnly = state.currentWeek?.status === 'closed'
  const sections = [...state.leftSections].sort((a, b) => a.sort_order - b.sort_order)
  const weekId = state.currentWeek?.id

  const moveSection = async (index, direction) => {
    const newSections = [...sections]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newSections.length) return

    const a = { ...newSections[index], sort_order: newSections[swapIndex].sort_order }
    const b = { ...newSections[swapIndex], sort_order: newSections[index].sort_order }

    dispatch({ type: 'UPSERT_SECTION', payload: a })
    dispatch({ type: 'UPSERT_SECTION', payload: b })

    await Promise.all([
      supabase.from('left_sections').update({ sort_order: a.sort_order }).eq('id', a.id),
      supabase.from('left_sections').update({ sort_order: b.sort_order }).eq('id', b.id),
    ])
  }

  const addCustomSection = async () => {
    if (!newTitle.trim() || !weekId) return
    const section = {
      id: uuidv4(),
      week_id: weekId,
      type: 'custom',
      title: newTitle.trim(),
      content: '',
      prospecting_days: null,
      sort_order: sections.length,
    }
    dispatch({ type: 'UPSERT_SECTION', payload: section })
    setNewTitle('')
    setAddingSection(false)
    const { data } = await supabase.from('left_sections').insert(section).select().single()
    if (data) dispatch({ type: 'UPSERT_SECTION', payload: data })
  }

  return (
    <div style={{ padding: '10px' }}>
      {sections.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          isReadOnly={isReadOnly}
          isFirst={i === 0}
          isLast={i === sections.length - 1}
          onMoveUp={() => moveSection(i, -1)}
          onMoveDown={() => moveSection(i, 1)}
        />
      ))}

      {!isReadOnly && (
        addingSection ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Section title"
              onKeyDown={e => { if (e.key === 'Enter') addCustomSection(); if (e.key === 'Escape') { setAddingSection(false); setNewTitle('') } }}
              style={{
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                padding: '5px 8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                outline: 'none',
              }}
            />
            <button onClick={addCustomSection} style={{ background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 2, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>ADD</button>
            <button onClick={() => { setAddingSection(false); setNewTitle('') }} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 2, padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingSection(true)}
            style={{
              width: '100%',
              background: 'none',
              border: '1px dashed var(--color-border)',
              borderRadius: 2,
              padding: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            + ADD SECTION
          </button>
        )
      )}
    </div>
  )
}

const reorderBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--color-border-strong)',
  cursor: 'pointer',
  fontSize: 11,
  padding: '0 3px',
  lineHeight: 1,
}
