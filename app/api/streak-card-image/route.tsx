// GET /api/streak-card-image
// Generates a dynamic content card image for Braze matching Figma design exactly
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

    // Day labels (single letter)
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    const completedCount = days.filter(Boolean).length

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(180deg, #97A7BF 5%, #96B7E5 107%)',
            padding: '12px 16px',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
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
                {/* Hatch icon (simplified star/asterisk) */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#040F1F',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  ✱
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
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
                  fontWeight: '400',
                  color: '#040F1F',
                  letterSpacing: '0.28px',
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
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '40px',
                    fontWeight: '400',
                    color: '#040F1F',
                    lineHeight: '40px',
                  }}
                >
                  {completedCount}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    color: 'rgba(4, 15, 31, 0.7)',
                    lineHeight: '24px',
                  }}
                >
                  / 7
                </span>
              </div>

              {/* Day circles with labels */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
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
                    {/* Circle with checkmark if done */}
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: done ? '#6BA4D9' : 'transparent',
                        border: done ? '2px solid #040F1F' : '1.5px solid rgba(4,15,31,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#040F1F',
                        fontSize: '12px',
                      }}
                    >
                      {done ? '✓' : ''}
                    </div>
                    {/* Day label */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'rgba(4, 15, 31, 0.7)',
                        letterSpacing: '0px',
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
        width: 346,
        height: 95,
      }
    )
  } catch (error) {
    console.error('streak-card-image error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
