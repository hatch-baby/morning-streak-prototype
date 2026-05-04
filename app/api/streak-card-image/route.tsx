// GET /api/streak-card-image
// Generates a dynamic content card image for Braze
// Query params:
//   hardware - comma-separated 0/1 values (default: "0,0,0,0,0,0,0")
//   manual - comma-separated 0/1 values (default: "0,0,0,0,0,0,0")

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const hardwareStr = searchParams.get('hardware') || '0,0,0,0,0,0,0'
    const manualStr = searchParams.get('manual') || '0,0,0,0,0,0,0'

    const hardware = hardwareStr.split(',').map(d => d === '1')
    const manual = manualStr.split(',').map(d => d === '1')

    // Merge: day is complete if EITHER hardware OR manual
    const days = hardware.map((hw, i) => hw || manual[i])

    // Hardcoded day labels
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const completedCount = days.filter(Boolean).length

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #97A7BF 5%, #96B7E5 107%)',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '346px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    background: '#040F1F',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#040F1F',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  MORNING ROUTINE
                </span>
              </div>
              <span
                style={{
                  fontSize: '14px',
                  color: '#040F1F',
                }}
              >
                Edit
              </span>
            </div>

            {/* Progress row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {/* Count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontSize: '40px',
                    fontWeight: 400,
                    color: '#040F1F',
                  }}
                >
                  {completedCount}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#040F1F',
                    opacity: 0.7,
                  }}
                >
                  /7
                </span>
              </div>

              {/* Day circles with labels */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                }}
              >
                {days.map((done, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: done ? '#6BA4D9' : '#A8BDD9',
                        border: done ? '2px solid #040F1F' : '1px solid rgba(4,15,31,0.2)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#040F1F',
                        opacity: 0.7,
                      }}
                    >
                      {labels[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 378,
        height: 155,
      }
    )
  } catch (error) {
    console.error('streak-card-image error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
