// POST /api/update-streak
// Updates ONLY the manual array in Braze. Hardware array is never touched by Vercel.
//
// Body: { family: string, manual: number[] }
//   family — Braze external_id (member_id)
//   manual — 7-element array of 0/1 for manually added days

import { NextRequest, NextResponse } from 'next/server'

const BRAZE_API_KEY = process.env.BRAZE_API_KEY!
const BRAZE_INSTANCE_URL = process.env.BRAZE_INSTANCE_URL! // e.g. https://rest.iad-01.braze.com

export async function POST(req: NextRequest) {
  try {
    const { family, manual } = await req.json()

    console.log('[update-streak] Received:', { family, manual })

    if (!family || !Array.isArray(manual) || manual.length !== 7) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Convert to comma-separated string for Braze
    const manualStr = manual.join(',')

    const brazePayload = {
      attributes: [
        {
          external_id: family,
          // ONLY update the manual array - hardware is owned by Redshift
          morning_streak_manual: manualStr,
        },
      ],
    }

    const brazeRes = await fetch(`${BRAZE_INSTANCE_URL}/users/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BRAZE_API_KEY}`,
      },
      body: JSON.stringify(brazePayload),
    })

    const brazeResponseText = await brazeRes.text()
    console.log('[update-streak] Braze response:', brazeRes.status, brazeResponseText)

    if (!brazeRes.ok) {
      console.error('Braze error:', brazeResponseText)
      return NextResponse.json({ error: 'Braze update failed' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update-streak error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
