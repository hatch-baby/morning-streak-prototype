// GET /api/streak-card-image
// Generates a dynamic content card image for Braze matching Figma design exactly
// Query params:
//   hardware - comma-separated 0/1 values (default: "0,0,0,0,0,0,0")
//   manual - comma-separated 0/1 values (default: "0,0,0,0,0,0,0")

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Base64-encoded image assets
const HATCH_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAN5JREFUeAGFUcsRgjAQ3Q1w8KIpISVgBdKBWoFSgSXYglYgVOBQAS1gB9ABemIGzRrChI8GfTOZ2f++lwWwwOUiaJ4tx2xBBLkDoqPxORe8z+mI4B5RqooyyViCRFedlLgHR/pEGDzvxbJvaGmcVMPBupEwqh95OKJE8MpgAsgg6WwtruUbwA8omhExFusNiFjAH6hiMdLgcLExYr+mI4Z1mUcw1MBArmFqOki/rzNBQl9NOjfTuhjiVvmx+qUVDG6hMTyOuxCpNxcX2zbHGFVVVt3aGS+Uupusyvyz4Q1Sh0i5G6vl3gAAAABJRU5ErkJggg=='
const DAY_COMPLETED = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAWJJREFUeAG9lr1OwzAUhW3ETgZmiARrRUckkBqJkQdgrdgYEQsjhaFssRjYGDow8RAuT0CExJwW2NM+we29liOlf7FjJznSUdroxl/uieOYM4MAIMJDD03HUJs0QyfaI855wlxEALQEe0l9U9aAAB2Du+jawAQJ0V/gLxojLOukDkgRFmwC+cS1TTHb8OCbUlQESWhOMod0wUOj9w846pyZyqIdZPWZo6a//+zpWbDe+ampNPKK7frmTnWTTv9MpZJAGThogoPv7h2q6CyUMlNF8v0D2Wy+dv4YO7m4vAJbGUH7Bx0VUVGPw1h1YxHZEigtK6BoaNCX1zf1nyIj+GBY6f3OrCbD7f1AwSjGfAJUlJoMDzaV9DyokxxYUcJ6+aHIaAJQdw7qtrcEtbqoapiA+iXWFiNo68OnYc1/ylc684lRgGlzsgKsdbvFLYD0DvTRJ2j6nd/tRPsTPcYN5LhsnAXjQN9IwDfTkAAAAABJRU5ErkJggg=='
const DAY_UPCOMING = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAQpJREFUeAHtVssNgzAMfaAiIfWSETJCR2AERmAERuooHaEjZIRcKlVCFbWjBAFtFD5JDxVPQiRg+8XY2AYCOAlZFUI2bk/rlq/Z/oK9YCNCSBGS4XtIbgIW5lOWQkqsBOsYb5cQsvCqk63VNy93EHwjHNvL3eIBNCXxIRKegC7I5vQpMW+JSQgpbAaRudTstLojAdh+T9+MY1SlImF0gMoAif/DuG6l5MhxYCtMr4lY4zwcbU4/kyoS5rktCDf8HMmKqg3LkN4voI7dj4xNrfSEiGrSNXY/OpNNr4DY2Zt8+h+Vgf1kl7cOJ7ZT68VKbsAIzWx2agrOdd5ap20QLdl8YBz25EHdL4jtG+k6OsxTOMdoAAAAAElFTkSuQmCC'

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
                {/* Hatch icon */}
                <img
                  src={HATCH_ICON}
                  width="12"
                  height="12"
                  style={{ flexShrink: 0 }}
                />
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
                    {/* Circle - completed or upcoming */}
                    <img
                      src={done ? DAY_COMPLETED : DAY_UPCOMING}
                      width="26"
                      height="26"
                      style={{ flexShrink: 0 }}
                    />
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
