'use client'

// Edit streaks page — hardware days are read-only, manual days can be toggled
// URL params:
//   family    — member ID
//   hardware  — hardware button taps (read-only), e.g. "1,0,1,0,0,0,0"
//   manual    — manually added days (editable), e.g. "0,1,0,0,0,0,0"
//   startDate — week start date

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'

function EditScreen() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const family = searchParams.get('family') || 'demo'
  const hardwareStr = searchParams.get('hardware') || '0,0,0,0,0,0,0'
  const manualStr = searchParams.get('manual') || '0,0,0,0,0,0,0'
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]

  const hardware = hardwareStr.split(',').map(d => d === '1')
  const initialManual = manualStr.split(',').map(d => d === '1')
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Local state — only manual days can be toggled
  const [manual, setManual] = useState<boolean[]>(initialManual)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(i: number) {
    // Hardware days are read-only
    if (hardware[i]) {
      return // Can't toggle hardware days
    }

    // Toggle manual day
    const next = [...manual]
    next[i] = !next[i]
    setManual(next)
  }

  function getLabel(i: number): 'auto' | 'manual' | 'none' {
    if (hardware[i]) return 'auto'
    if (manual[i]) return 'manual'
    return 'none'
  }

  function isDayComplete(i: number): boolean {
    return hardware[i] || manual[i]
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/update-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family,
          manual: manual.map(m => m ? 1 : 0), // Only send manual array
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      // Navigate back to streak view with updated manual state
      const newManualStr = manual.map(m => m ? 1 : 0).join(',')
      router.push(
        `/streak?family=${encodeURIComponent(family)}&hardware=${encodeURIComponent(hardwareStr)}&manual=${encodeURIComponent(newManualStr)}&startDate=${encodeURIComponent(startDate)}`
      )
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  function handleClose() {
    router.back()
  }

  return (
    <div style={{
      backgroundColor: '#030d1c',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '375px', position: 'relative' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '32px', position: 'relative',
        }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'white' }}>
            Edit Streaks
          </div>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', right: 0,
              background: 'none', border: 'none',
              color: '#7aa3cc', fontSize: '22px',
              cursor: 'pointer', lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Day rows */}
        <div style={{ marginBottom: '24px' }}>
          {dayLabels.map((label, i) => {
            const labelType = getLabel(i)
            const isComplete = isDayComplete(i)
            const isHardware = hardware[i]

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '20px',
                  marginBottom: i < 6 ? '4px' : 0,
                  borderBottom: i < 6 ? '1px solid #1e3d6b' : 'none',
                  opacity: isHardware ? 0.7 : 1, // Hardware days slightly dimmed
                }}
              >
                {/* Day label */}
                <div style={{ fontSize: '22px', fontWeight: '500', color: 'white', width: '68px' }}>
                  {label}
                </div>

                {/* Source pill */}
                <div style={{ flex: 1, paddingLeft: '16px' }}>
                  {labelType !== 'none' && (
                    <div style={{
                      display: 'inline-block',
                      border: '1px solid rgba(217,217,217,0.5)',
                      borderRadius: '30px',
                      padding: '3px 12px',
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                      {labelType === 'auto' ? 'Button Tap' : 'Added by you'}
                    </div>
                  )}
                </div>

                {/* Toggle circle */}
                <button
                  onClick={() => toggle(i)}
                  disabled={isHardware}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isComplete ? '#378ADD' : 'transparent',
                    border: isComplete ? 'none' : '2px solid #2a4d7a',
                    cursor: isHardware ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {isComplete && (
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                      <path d="M1 6L5.5 10.5L15 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#2d1a1a', border: '1px solid #993535',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '12px', color: '#f09595',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '10px',
            backgroundColor: saving ? '#1e3d6b' : '#185FA5',
            border: 'none',
            color: saving ? '#7aa3cc' : 'white',
            fontSize: '15px', fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            transition: 'background-color 0.15s',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {/* Info banner */}
        <div style={{
          backgroundColor: '#13294b',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <div style={{ color: '#7aa3cc', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>ℹ</div>
          <div style={{
            fontSize: '13px', color: 'white',
            lineHeight: '1.5', fontWeight: '500',
            letterSpacing: '0.02em',
          }}>
            Days with &lsquo;Button Tap&rsquo; were automatically recorded and cannot be removed. You can add any missed days manually.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#030d1c', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7aa3cc', fontSize: '14px' }}>Loading…</div>
      </div>
    }>
      <EditScreen />
    </Suspense>
  )
}
