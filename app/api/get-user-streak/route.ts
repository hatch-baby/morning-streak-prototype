// GET /api/get-user-streak?family={external_id}
// Fetches user's streak data from Braze

import { NextRequest, NextResponse } from 'next/server'

const BRAZE_API_KEY = process.env.BRAZE_API_KEY!
const BRAZE_INSTANCE_URL = process.env.BRAZE_INSTANCE_URL!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const family = searchParams.get('family')

    if (!family) {
      return NextResponse.json({ error: 'Missing family parameter' }, { status: 400 })
    }

    console.log('[get-user-streak] Fetching data for user:', family)

    // Fetch user data from Braze
    const brazeRes = await fetch(`${BRAZE_INSTANCE_URL}/users/export/ids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BRAZE_API_KEY}`,
      },
      body: JSON.stringify({
        external_ids: [family],
        fields_to_export: [
          'external_id',
          'custom_attributes',
        ],
      }),
    })

    if (!brazeRes.ok) {
      console.error('[get-user-streak] Braze error:', brazeRes.status)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 502 })
    }

    const brazeData = await brazeRes.json()
    console.log('[get-user-streak] Braze response:', JSON.stringify(brazeData))

    if (!brazeData.users || brazeData.users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = brazeData.users[0]
    const customAttrs = user.custom_attributes || {}

    const hardware = customAttrs.morning_streak_hardware || '0,0,0,0,0,0,0'
    const manual = customAttrs.morning_streak_manual || '0,0,0,0,0,0,0'
    const startDate = customAttrs.morning_streak_start_date || new Date().toISOString().split('T')[0]

    return NextResponse.json({
      hardware,
      manual,
      startDate,
    })
  } catch (err) {
    console.error('[get-user-streak] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
