// Streak display page — unified parent + kid view
// URL params:
//   family   — member ID (external_id in Braze)
//   hardware — 7 comma-separated 0/1 values from Redshift, e.g. "1,0,1,0,0,0,0"
//   manual   — 7 comma-separated 0/1 values from Vercel edits, e.g. "0,1,0,0,0,0,0"
//   startDate — Week start date, e.g. "2026-04-28"

interface StreakPageProps {
  searchParams: {
    family?: string
    hardware?: string
    manual?: string
    startDate?: string
  }
}

function getCharacter(count: number): string {
  if (count === 0) return '😊'
  if (count <= 2) return '😄'
  if (count <= 4) return '🤩'
  if (count <= 6) return '🎉'
  return '🏆'
}

function getMessage(count: number, name: string): string {
  if (count === 0) return `Ready to start ${name}'s first morning routine?`
  if (count === 1) return `Day 1 done! See you tomorrow.`
  if (count < 5) return `${count} mornings in — ${5 - count} more to hit your goal.`
  if (count === 5) return `Goal reached! ${name} can still keep going — ${7 - count} days left.`
  if (count < 7) return `${count} out of 7 — so close to a perfect week!`
  return `Perfect week! ${name} completed every morning. 🎉`
}

function getAutoLabel(count: number): string {
  if (count === 0) return ''
  return `${count} auto-logged via button tap`
}

export default function StreakPage({ searchParams }: StreakPageProps) {
  const family = searchParams.family || 'demo'
  const hardwareStr = searchParams.hardware || '0,0,0,0,0,0,0'
  const manualStr = searchParams.manual || '0,0,0,0,0,0,0'
  const startDate = searchParams.startDate || new Date().toISOString().split('T')[0]

  // Parse arrays
  const hardware = hardwareStr.split(',').map(d => d === '1')
  const manual = manualStr.split(',').map(d => d === '1')

  // Merge: day is complete if EITHER hardware OR manual
  const days = hardware.map((hw, i) => hw || manual[i])

  // Auto = hardware (only hardware button taps are "auto")
  const auto = hardware

  // Hardcoded day labels
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const completedCount = days.filter(Boolean).length
  const autoCount = auto.filter(Boolean).length
  const isGoalHit = completedCount >= 5
  const isPerfect = completedCount === 7

  const accentColor = isPerfect ? '#97C459' : isGoalHit ? '#97C459' : '#FAC775'
  const barColor = isGoalHit ? '#3B6D11' : '#BA7517'

  const editUrl = `/edit?family=${encodeURIComponent(family)}&hardware=${encodeURIComponent(hardwareStr)}&manual=${encodeURIComponent(manualStr)}&startDate=${encodeURIComponent(startDate)}`

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#030d1c',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '340px',
        backgroundColor: '#13294b',
        borderRadius: '16px',
        padding: '20px',
        border: isPerfect ? '1px solid #3B6D11' : isGoalHit ? '1px solid #3B6D11' : completedCount > 0 ? '1px solid #FAC775' : '1px solid #1e3d6b',
      }}>

        {/* Top row — character + name/status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: '#1e3d6b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', flexShrink: 0,
          }}>
            {getCharacter(completedCount)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>
              {name}&rsquo;s morning routine
            </div>
            <div style={{ fontSize: '11px', color: '#7aa3cc', marginTop: '3px' }}>
              Week 1
              {autoCount > 0 && (
                <span style={{ color: '#97C459', marginLeft: '6px' }}>
                  · {getAutoLabel(autoCount)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stars row with day labels */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          {days.map((done, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  backgroundColor: done ? '#FAC775' : '#1e3d6b',
                  border: done ? 'none' : '1px solid #2a4d7a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  transition: 'background-color 0.2s',
                }}
              >
                {done ? '⭐' : ''}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#7aa3cc',
                textAlign: 'center',
              }}>
                {labels[i]}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            flex: 1, height: '6px',
            backgroundColor: '#1e3d6b',
            borderRadius: '3px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(completedCount / 7) * 100}%`,
              backgroundColor: barColor,
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: accentColor, flexShrink: 0 }}>
            {completedCount}
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#7aa3cc' }}>/7</span>
          </div>
        </div>

        {/* Message */}
        <div style={{
          fontSize: '12px', color: '#9fc3e8',
          lineHeight: '1.5', marginBottom: '18px',
        }}>
          {getMessage(completedCount, name)}
        </div>

        {/* Goal badge — shown once goal is hit */}
        {isGoalHit && (
          <div style={{
            backgroundColor: '#1a3d1a',
            border: '1px solid #3B6D11',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#97C459',
            marginBottom: '14px',
            textAlign: 'center',
          }}>
            {isPerfect ? '🏆 Perfect week — first week complete!' : '✅ Goal hit — 5 of 7 days done!'}
          </div>
        )}

        {/* Edit link */}
        <a
          href={editUrl}
          style={{
            display: 'block', textAlign: 'center',
            padding: '10px', borderRadius: '8px',
            border: '1px solid #2a4d7a',
            color: '#7aa3cc', fontSize: '13px',
          }}
        >
          Edit streaks
        </a>
      </div>
    </div>
  )
}
