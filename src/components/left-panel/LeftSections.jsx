import { useApp } from '../../context/AppContext'

export default function LeftSections() {
  const { state } = useApp()
  const sections = [...state.leftSections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{ padding: '12px' }}>
      {sections.map(section => (
        <div key={section.id} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          marginBottom: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-canvas)',
          }}>
            {section.title}
          </div>
          <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {section.type === 'prospecting' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => (
                  <label key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={section.prospecting_days?.[day] || false} readOnly />
                    <span className="mono" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{day}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                {section.content || 'Empty — click to edit'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
