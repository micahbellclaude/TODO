import IntakeSection from '../intake/IntakeSection'
import LeftSections from './LeftSections'

export default function LeftPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-canvas)' }}>
      <IntakeSection />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <LeftSections />
      </div>
    </div>
  )
}
