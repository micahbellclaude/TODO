import { useState, useRef, useEffect, useCallback } from 'react'

const CX = 110
const CY = 110
const OUTER_R = 90
const INNER_R = 58
const DOT_R = 84
const DOT_SIZE = 5
const NOTCH_DEG = 36 // 360 / 10

function decagonPoints(rotation) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36) + rotation - 90) * (Math.PI / 180)
    return `${CX + OUTER_R * Math.cos(a)},${CY + OUTER_R * Math.sin(a)}`
  }).join(' ')
}

function dotPositions(rotation) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36) + rotation - 90) * (Math.PI / 180)
    return { x: CX + DOT_R * Math.cos(a), y: CY + DOT_R * Math.sin(a) }
  })
}

export default function TimeWheel({ onChange }) {
  const svgRef = useRef(null)
  const stateRef = useRef({
    isDragging: false,
    lastAngle: 0,
    accumDeg: 0,
    mode: 'hours',
    hours: 0,
    minutes: 0,
    visualRotation: 0,
  })
  const [display, setDisplay] = useState({ mode: 'hours', hours: 0, minutes: 0, rotation: 0 })

  const getClientAngle = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI)
  }, [])

  const applyIncrement = useCallback((dir) => {
    const s = stateRef.current
    if (s.mode === 'hours') {
      s.hours = Math.max(0, Math.min(23, s.hours + dir))
    } else {
      s.minutes += dir * 10
      if (s.minutes >= 60) { s.minutes -= 60; s.hours = Math.min(23, s.hours + 1) }
      if (s.minutes < 0) { s.minutes += 60; s.hours = Math.max(0, s.hours - 1) }
    }
    setDisplay({ mode: s.mode, hours: s.hours, minutes: s.minutes, rotation: s.visualRotation })
    const totalMin = s.hours * 60 + s.minutes
    onChange?.(totalMin)
  }, [onChange])

  const onMove = useCallback((e) => {
    if (!stateRef.current.isDragging) return
    if (e.cancelable) e.preventDefault()
    const angle = getClientAngle(e)
    let delta = angle - stateRef.current.lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    stateRef.current.lastAngle = angle
    stateRef.current.accumDeg += delta
    stateRef.current.visualRotation += delta
    setDisplay(d => ({ ...d, rotation: stateRef.current.visualRotation }))

    while (stateRef.current.accumDeg >= NOTCH_DEG) {
      stateRef.current.accumDeg -= NOTCH_DEG
      applyIncrement(1)
    }
    while (stateRef.current.accumDeg <= -NOTCH_DEG) {
      stateRef.current.accumDeg += NOTCH_DEG
      applyIncrement(-1)
    }
  }, [getClientAngle, applyIncrement])

  const onEnd = useCallback(() => {
    stateRef.current.isDragging = false
    // Snap visual rotation to nearest notch (every 36°)
    const snapped = Math.round(stateRef.current.visualRotation / NOTCH_DEG) * NOTCH_DEG
    stateRef.current.visualRotation = snapped
    stateRef.current.accumDeg = 0
    setDisplay(d => ({ ...d, rotation: snapped }))
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [onMove, onEnd])

  const onStart = (e) => {
    e.preventDefault()
    stateRef.current.isDragging = true
    stateRef.current.lastAngle = getClientAngle(e)
    stateRef.current.accumDeg = 0
  }

  const toggleMode = () => {
    const s = stateRef.current
    s.mode = s.mode === 'hours' ? 'minutes' : 'hours'
    setDisplay(d => ({ ...d, mode: s.mode }))
  }

  const { mode, hours, minutes, rotation } = display
  const timeLabel = hours > 0 && minutes > 0
    ? `${hours}h ${minutes}m`
    : hours > 0 ? `${hours}h`
    : minutes > 0 ? `${minutes}m`
    : '0m'

  const dots = dotPositions(rotation)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, userSelect: 'none' }}>
      <svg
        ref={svgRef}
        width="220"
        height="220"
        viewBox="0 0 220 220"
        style={{ cursor: 'grab', touchAction: 'none' }}
        onMouseDown={onStart}
        onTouchStart={onStart}
      >
        {/* Fixed top marker */}
        <path d="M 110 14 L 104 26 L 116 26 Z" fill="var(--color-text)" />

        {/* Rotating group */}
        <g>
          {/* Orange decagon */}
          <polygon
            points={decagonPoints(rotation)}
            fill="var(--color-accent)"
            stroke="var(--color-accent-hover)"
            strokeWidth="1"
          />
          {/* Vertex dots */}
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={DOT_SIZE} fill="white" opacity={0.9} />
          ))}
        </g>

        {/* Fixed inner circle (dark center) */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="var(--color-text)" />

        {/* Mode label */}
        <text
          x={CX}
          y={CY - 16}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="9"
          letterSpacing="2"
          fill="var(--color-accent)"
          style={{ pointerEvents: 'none' }}
        >
          {mode === 'hours' ? 'HRS' : 'MIN'}
        </text>

        {/* Time display */}
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="22"
          fontWeight="500"
          fill="white"
          style={{ pointerEvents: 'none' }}
        >
          {timeLabel}
        </text>

        {/* Mode toggle tap area */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={toggleMode}
          onMouseDown={e => e.stopPropagation()}
        />
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
          CLICK CENTER TO SWITCH {mode === 'hours' ? '→ MINUTES' : '→ HOURS'}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[15, 30, 60, 90].map(m => (
            <button
              key={m}
              onClick={() => {
                const h = Math.floor(m / 60)
                const mins = m % 60
                stateRef.current.hours = h
                stateRef.current.minutes = mins
                setDisplay(d => ({ ...d, hours: h, minutes: mins }))
                onChange?.(m)
              }}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                padding: '3px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
