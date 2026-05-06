'use client'

// Edit streaks page — fetches user data from Braze server-side
// URL params:
//   family — member ID (Braze external_id)

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function EditScreen() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const family = searchParams.get('family') || searchParams.get('userId') || 'demo'

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // State for fetched data
  const [hardware, setHardware] = useState<boolean[]>([false, false, false, false, false, false, false])
  const [manual, setManual] = useState<boolean[]>([false, false, false, false, false, false, false])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data from Braze on mount
  useEffect(() => {
    async function fetchUserData() {
      if (!family || family === 'demo') {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/get-user-streak?family=${family}`)

        if (!res.ok) {
          throw new Error('Failed to load streak data')
        }

        const data = await res.json()

        // Parse hardware and manual arrays
        const hardwareArr = data.hardware.split(',').map((d: string) => d === '1')
        const manualArr = data.manual.split(',').map((d: string) => d === '1')

        setHardware(hardwareArr)

        // Merge hardware and manual: day is checked if EITHER hardware OR manual
        // This ensures hardware taps are visible even if not in manual array
        const merged = hardwareArr.map((hw: boolean, i: number) => hw || manualArr[i])
        setManual(merged)

        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
        setError('Failed to load your streak data. Please try again.')
        setLoading(false)
      }
    }

    fetchUserData()
  }, [family])

  // All days can be toggled
  function toggle(i: number) {
    const next = [...manual]
    next[i] = !next[i]
    setManual(next)
  }

  // Badge shows ORIGIN (not current state)
  // If hardware[i] = true, it's always "Button-tap" regardless of current toggle state
  function getLabel(i: number): 'auto' | 'manual' | 'none' {
    if (!manual[i]) return 'none' // Not currently checked
    if (hardware[i]) return 'auto' // Origin: hardware button tap
    return 'manual' // Origin: manually added by parent
  }

  function isDayComplete(i: number): boolean {
    return manual[i] // Manual is now the source of truth
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      // Add 10 second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch('/api/update-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family,
          manual: manual.map(m => m ? 1 : 0), // Only send manual array
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) throw new Error('Failed to save')

      // Success! Show saved state
      setSaving(false)
      setSaved(true)
    } catch (err) {
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out. Please check your connection.'
        : 'Something went wrong. Please try again.'
      setError(message)
      setSaving(false)
    }
  }

  function handleClose() {
    // Try to go back, or close window if no history
    if (window.history.length > 1) {
      router.back()
    } else {
      // In webview, try to close
      window.close()
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{
        backgroundColor: '#030d1c',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#7aa3cc', fontSize: '14px' }}>Loading your streak...</div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#030d1c',
      minHeight: '100dvh',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '375px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Header - Just spacing */}
        <div style={{
          padding: '16px 20px 12px',
          flexShrink: 0,
        }}>
        </div>

        {/* Scrollable content area */}
        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 20px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Info banner - moved above day list */}
          <div style={{
            backgroundColor: '#13294b',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            marginBottom: '16px',
          }}>
          <div style={{ width: '24px', height: '24px', flexShrink: 0, marginTop: '1px' }}>
            <svg width="18" height="18" viewBox="0 0 18.167 18.1582" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.0791 18.1582C7.83691 18.1582 6.66797 17.9209 5.57227 17.4463C4.47656 16.9775 3.50977 16.3242 2.67188 15.4863C1.83984 14.6484 1.18652 13.6816 0.711914 12.5859C0.237305 11.4902 0 10.3213 0 9.0791C0 7.83691 0.237305 6.66797 0.711914 5.57227C1.18652 4.47656 1.83984 3.5127 2.67188 2.68066C3.50977 1.84277 4.47363 1.18652 5.56348 0.711914C6.65918 0.237305 7.82812 0 9.07031 0C10.3184 0 11.4902 0.237305 12.5859 0.711914C13.6816 1.18652 14.6484 1.84277 15.4863 2.68066C16.3242 3.5127 16.9805 4.47656 17.4551 5.57227C17.9297 6.66797 18.167 7.83691 18.167 9.0791C18.167 10.3213 17.9297 11.4902 17.4551 12.5859C16.9805 13.6816 16.3242 14.6484 15.4863 15.4863C14.6484 16.3242 13.6816 16.9775 12.5859 17.4463C11.4902 17.9209 10.3213 18.1582 9.0791 18.1582ZM9.0791 16.3652C10.0928 16.3652 11.0391 16.1777 11.918 15.8027C12.8027 15.4277 13.5762 14.9062 14.2383 14.2383C14.9062 13.5703 15.4277 12.7969 15.8027 11.918C16.1777 11.0391 16.3652 10.0928 16.3652 9.0791C16.3652 8.07129 16.1777 7.12793 15.8027 6.24902C15.4277 5.36426 14.9033 4.58789 14.2295 3.91992C13.5615 3.25195 12.7881 2.73047 11.9092 2.35547C11.0303 1.98047 10.084 1.79297 9.07031 1.79297C8.0625 1.79297 7.11621 1.98047 6.23145 2.35547C5.35254 2.73047 4.58203 3.25195 3.91992 3.91992C3.25781 4.58789 2.73926 5.36426 2.36426 6.24902C1.98926 7.12793 1.80176 8.07129 1.80176 9.0791C1.80176 10.0928 1.98926 11.0391 2.36426 11.918C2.73926 12.7969 3.25781 13.5703 3.91992 14.2383C4.58789 14.9062 5.36133 15.4277 6.24023 15.8027C7.125 16.1777 8.07129 16.3652 9.0791 16.3652ZM7.53223 13.8516C7.33301 13.8516 7.16602 13.7871 7.03125 13.6582C6.89648 13.5293 6.8291 13.3682 6.8291 13.1748C6.8291 12.9814 6.89648 12.8203 7.03125 12.6914C7.16602 12.5625 7.33301 12.498 7.53223 12.498H8.57812V8.81543H7.69043C7.49121 8.81543 7.32422 8.75098 7.18945 8.62207C7.05469 8.49316 6.9873 8.3291 6.9873 8.12988C6.9873 7.94238 7.05469 7.78418 7.18945 7.65527C7.32422 7.52637 7.49121 7.46191 7.69043 7.46191H9.36035C9.60645 7.46191 9.79395 7.54102 9.92285 7.69922C10.0518 7.85742 10.1162 8.06836 10.1162 8.33203V12.498H11.1006C11.2939 12.498 11.458 12.5625 11.5928 12.6914C11.7275 12.8203 11.7949 12.9814 11.7949 13.1748C11.7949 13.3682 11.7275 13.5293 11.5928 13.6582C11.458 13.7871 11.2939 13.8516 11.1006 13.8516H7.53223ZM9.02637 6.09082C8.69824 6.09082 8.41699 5.97363 8.18262 5.73926C7.94824 5.49902 7.83105 5.21484 7.83105 4.88672C7.83105 4.55273 7.94824 4.26855 8.18262 4.03418C8.41699 3.7998 8.69824 3.68262 9.02637 3.68262C9.36621 3.68262 9.65039 3.7998 9.87891 4.03418C10.1074 4.26855 10.2217 4.55273 10.2217 4.88672C10.2217 5.21484 10.1074 5.49902 9.87891 5.73926C9.65039 5.97363 9.36621 6.09082 9.02637 6.09082Z" fill="#7aa3cc"/>
            </svg>
          </div>
          <div style={{
            fontSize: '13px',
            color: 'white',
            lineHeight: '1.4',
            fontWeight: '400',
            letterSpacing: '-0.08px',
          }}>
            Days with &lsquo;Button-tap&rsquo; were automatically recorded when your child tapped the Big Button.
          </div>
          </div>

          {/* Day rows */}
          <div style={{ marginBottom: '16px' }}>
          {dayLabels.map((label, i) => {
            const labelType = getLabel(i)
            const isComplete = isDayComplete(i)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  paddingBottom: '14px',
                  borderBottom: i < 6 ? '1px solid #1e3d6b' : 'none',
                }}
              >
                {/* Day label */}
                <div style={{
                  fontSize: '19px',
                  fontWeight: '600',
                  color: 'white',
                  minWidth: '60px',
                  flexShrink: 0,
                  letterSpacing: '-0.4px',
                }}>
                  {label}
                </div>

                {/* Source pill */}
                <div style={{
                  flex: 1,
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {labelType !== 'none' && (
                    <div style={{
                      display: 'inline-block',
                      border: '1px solid #d9d9d9',
                      borderRadius: '30px',
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: '400',
                      color: 'white',
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.08px',
                    }}>
                      {labelType === 'auto' ? 'Button-tap' : 'Added by you'}
                    </div>
                  )}
                </div>

                {/* Toggle circle */}
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    borderRadius: '50%',
                    backgroundColor: isComplete ? 'white' : 'transparent',
                    border: isComplete ? 'none' : '2px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    opacity: labelType === 'auto' ? 0.5 : 1,
                  }}
                >
                  {isComplete && (
                    <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                      <path d="M1 6L5.5 10.5L15 1" stroke="#030d1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>

        {/* Fixed Save button at bottom */}
        <div style={{
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          flexShrink: 0,
          backgroundColor: '#030d1c',
        }}>
          {saved ? (
            <div style={{
              width: '100%',
              padding: '14px',
              borderRadius: '30px',
              backgroundColor: '#4CAF50',
              border: 'none',
              color: 'white',
              fontSize: '17px',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '-0.4px',
            }}>
              ✓ Saved! Close this page to see your updated streak.
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '30px',
                backgroundColor: saving ? '#b8a798' : '#e8ddd1',
                border: 'none',
                color: '#030d1c',
                fontSize: '17px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                letterSpacing: '-0.4px',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
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
